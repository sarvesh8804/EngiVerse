import { GitHubFile, GitHubRepository, ExtractionOptions, ExtractedCode } from '../types/github';

class GitHubService {
  // Use the backend proxy so we never expose a token from the client
  private backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const url = `${this.backendBase}/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText}`);
    }

    return response.json();
  }

  async getRepositoryContents(owner: string, repo: string, path = ''): Promise<GitHubFile[]> {
    const url = new URL(`${this.backendBase}/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`);
    if (path) url.searchParams.set('path', path);
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch repository contents: ${response.statusText}`);
    }

    return response.json();
  }

  async getFileContent(downloadUrl: string): Promise<string> {
    const url = new URL(`${this.backendBase}/api/github/file`);
    url.searchParams.set('download_url', downloadUrl);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }
    return response.text();
  }

  private shouldIncludeFile(file: GitHubFile, options: ExtractionOptions): boolean {
    // Check file size
    if (file.size > options.maxFileSize) {
      return false;
    }

    // Check if it's in excluded directories
    const isInExcludedDir = options.excludeDirectories.some(dir => 
      file.path.toLowerCase().includes(dir.toLowerCase())
    );
    if (isInExcludedDir) {
      return false;
    }

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    // Check excluded extensions
    if (options.excludeExtensions.includes(extension)) {
      return false;
    }

    // Check included extensions (if specified)
    if (options.includeExtensions.length > 0) {
      return options.includeExtensions.includes(extension);
    }

    return true;
  }

  private getLanguageFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'md': 'Markdown',
      'sql': 'SQL',
      'sh': 'Shell',
      'dockerfile': 'Docker'
    };
    
    return languageMap[extension || ''] || 'Text';
  }

  async extractRepositoryCode(
    owner: string, 
    repo: string, 
    options: ExtractionOptions
  ): Promise<ExtractedCode> {
    const repository = await this.getRepository(owner, repo);
    const allFiles: Array<{
      path: string;
      content: string;
      size: number;
      language: string;
    }> = [];

    const processDirectory = async (path = ''): Promise<void> => {
      const contents = await this.getRepositoryContents(owner, repo, path);
      
      for (const item of contents) {
        if (allFiles.length >= options.maxFiles) {
          break;
        }

        if (item.type === 'file' && this.shouldIncludeFile(item, options)) {
          try {
            const content = await this.getFileContent(item.download_url);
            allFiles.push({
              path: item.path,
              content,
              size: item.size,
              language: this.getLanguageFromExtension(item.name)
            });
          } catch (error) {
            console.warn(`Failed to fetch content for ${item.path}:`, error);
          }
        } else if (item.type === 'dir' && allFiles.length < options.maxFiles) {
          // Check if directory should be excluded
          const isExcluded = options.excludeDirectories.some(dir => 
            item.path.toLowerCase().includes(dir.toLowerCase())
          );
          
          if (!isExcluded) {
            await processDirectory(item.path);
          }
        }
      }
    };

    await processDirectory();

    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);

    return {
      repository,
      files: allFiles,
      totalFiles: allFiles.length,
      totalSize,
      extractedAt: new Date().toISOString()
    };
  }
}

export const githubService = new GitHubService();