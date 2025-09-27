export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExtractionOptions {
  includeExtensions: string[];
  excludeExtensions: string[];
  excludeDirectories: string[];
  maxFileSize: number;
  maxFiles: number;
}

export interface ExtractedCode {
  repository: GitHubRepository;
  files: Array<{
    path: string;
    content: string;
    size: number;
    language: string;
  }>;
  totalFiles: number;
  totalSize: number;
  extractedAt: string;
}

export interface CodeSummary {
  overview: string;
  keyFeatures: string[];
  techStack: string[];
  projectStructure: string;
  gettingStarted: string;
  mainFiles: string[];
  complexity: 'Low' | 'Medium' | 'High';
  estimatedReadingTime: string;
  futureScope: string;
  roadmap: { step: string; description: string }[];
  pitchDeck?: string;
}