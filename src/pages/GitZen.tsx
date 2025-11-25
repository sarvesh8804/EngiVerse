import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { GitZenHeader } from '../components/GitZenHeader';
import { RepositoryInput } from '../components/RepositoryInput';
import { ExtractionOptionsComponent } from '../components/ExtractionOptions';
import { RepositoryInfo } from '../components/RepositoryInfo';
import { CodeSummary } from '../components/CodeSummary';
import { ExtractedCodeView } from '../components/ExtractedCodeView';
import { githubService } from '../services/githubService';
import { geminiService } from '../services/geminiService';
import { ExtractionOptions, ExtractedCode, CodeSummary as CodeSummaryType } from '../types/github';
import { AISummary } from '../components/AISummary';

export const GitZen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedCode, setExtractedCode] = useState<ExtractedCode | null>(null);
  const [codeSummary, setCodeSummary] = useState<CodeSummaryType | null>(null);
  const [extractionOptions, setExtractionOptions] = useState<ExtractionOptions>({
    includeExtensions: [],
    excludeExtensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'pdf', 'zip', 'tar', 'gz'],
    excludeDirectories: ['node_modules', '.git', 'dist', 'build', 'target', 'bin', 'obj'],
    maxFileSize: 100000, // 100KB
    maxFiles: 50
  });

  const handleAnalyzeRepository = async (owner: string, repo: string) => {
    setLoading(true);
    setError(null);
    setExtractedCode(null);
    setCodeSummary(null);

    try {
      // Extract code from repository
      const extracted = await githubService.extractRepositoryCode(owner, repo, extractionOptions);
      setExtractedCode(extracted);

      // Generate AI summary
      try {
        const { technicalSummary } = await geminiService.summarizeCode(extracted);
        setCodeSummary(technicalSummary);
      } catch (summaryError) {
        console.error('Failed to generate summary:', summaryError);
        // Continue without summary - the extracted code is still valuable
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasApiKeys = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  if (!hasApiKeys) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <GitZenHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">API Keys Required</h3>
            </div>
            <div className="space-y-4 text-yellow-700">
              <p>To use GitZen, you need to set up the following API keys:</p>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border">
                  <strong>VITE_GEMINI_API_KEY</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Get your API key from: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <strong>VITE_GITHUB_TOKEN</strong> (optional)
                  <p className="text-sm text-gray-600 mt-1">
                    If you want the frontend to query GitHub directly (not recommended), set this token. Otherwise configure the backend with <code>GITHUB_TOKEN</code> and set <code>VITE_BACKEND_URL</code> for the frontend to proxy requests through the server.
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Setup Instructions:</strong>
                  <br />1. Create a <code>.env</code> file in your project root
                  <br />2. Add your API keys (see <code>.env.example</code> for format)
                  <br />3. Restart your development server
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      
      <div className="container mx-auto px-4 py-8">
        <RepositoryInput onSubmit={handleAnalyzeRepository} loading={loading} />
        
        <ExtractionOptionsComponent 
          options={extractionOptions} 
          onChange={setExtractionOptions} 
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {extractedCode && (
          <>
            <RepositoryInfo repository={extractedCode.repository} />
            
            {codeSummary && (
              <>
                <CodeSummary 
                  summary={codeSummary} 
                  repositoryName={extractedCode.repository.full_name} 
                />
                {/* <AISummary summary={codeSummary} /> */}
              </>
            )}
            
            <ExtractedCodeView extractedCode={extractedCode} />
          </>
        )}
      </div>
    </div>
  );
};

export default GitZen;












