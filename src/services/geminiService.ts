import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedCode, CodeSummary } from '../types/github';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using a suitable model for code analysis
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); 
  }

  private createPrompt(extractedCode: ExtractedCode): string {
    const { repository, files } = extractedCode;

    // Generate an introduction based on filenames
    const fileNames = files.map(file => file.path.split('/').pop()).join(', ');
    const introduction = `This project contains the following key files: ${fileNames}. These files indicate that the project is likely a web-based application with components, services, and types organized for scalability and maintainability.`;

    // Create a condensed version of the code for analysis
    const codeSnippets = files.slice(0, 20).map(file => {
      const truncatedContent = file.content.length > 2000
        ? file.content.substring(0, 2000) + '...[truncated]'
        : file.content;
      
      return `
File: ${file.path} (${file.language})
${truncatedContent}
---`;
    }).join('\n');

    return `
Analyze this GitHub repository and provide three types of summaries:

1. **Technical Summary**:
- Repository: ${repository.full_name}
- Description: ${repository.description || 'No description provided'}
- Primary Language: ${repository.language || 'Not specified'}
- Stars: ${repository.stargazers_count}
- Forks: ${repository.forks_count}

Introduction:
${introduction}

Code Files (${files.length} total files):
${codeSnippets}

Please provide a JSON response with the following structure. Do not include any text before or after the JSON block.
{
  "overview": "A comprehensive overview of what this project does and its main purpose",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "techStack": ["technology1", "technology2", "technology3"],
  "projectStructure": "Description of how the project is organized",
  "gettingStarted": "Brief guide on how to get started with this project",
  "mainFiles": ["important_file1.js", "important_file2.py"],
  "complexity": "Low|Medium|High",
  "estimatedReadingTime": "X minutes",
  "futureScope": "Potential future improvements or extensions for this project",
  "roadmap": [
    { "step": "Step 1", "description": "Define the project goals and objectives." },
    { "step": "Step 2", "description": "Set up the development environment and tools." },
    { "step": "Step 3", "description": "Develop the core features and functionalities." },
    { "step": "Step 4", "description": "Test and debug the application thoroughly." },
    { "step": "Step 5", "description": "Deploy the application to the production environment." },
    { "step": "Step 6", "description": "Gather user feedback and iterate on improvements." }
  ]
    "pitchDeck": "A concise, persuasive pitch deck for this project, suitable for investors or stakeholders."
}

2. **Non-Technical Summary**:
- What this project is and its main purpose.
- Who the target audience or users are.
- The key features and benefits of the project.
- The technologies or tools used, described in simple terms.

3. **Roadmap**:
- A step-by-step plan for the project, including key milestones and objectives.

Provide the technical summary in JSON format enclosed in a Markdown code block like \`\`\`json... \`\`\`. Provide the non-technical summary and roadmap in plain text.`;
  }

  async summarizeCode(extractedCode: ExtractedCode): Promise<{ technicalSummary: CodeSummary; nonTechnicalSummary: string }> {
    try {
      const prompt = this.createPrompt(extractedCode);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      // Use a regex to find the content within the ```json...``` block
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);

      if (jsonMatch && jsonMatch[1]) {
        const cleanedJson = jsonMatch[1];
        
        try {
          const technicalSummary: CodeSummary = JSON.parse(cleanedJson);
          
          // Use a split to isolate the non-technical part
          const nonTechnicalPart = text.split(/\n\n2\. \*\*Non-Technical Summary\*\*:/)[1];
          const nonTechnicalSummary = nonTechnicalPart?.trim() || 'Non-technical summary not provided.';

          return { technicalSummary, nonTechnicalSummary };
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          console.error('Raw JSON part:', cleanedJson);

          // Fallback if JSON parsing fails but a JSON block was found
          return {
            technicalSummary: {
              overview: 'Unable to parse technical summary.',
              keyFeatures: [],
              techStack: [],
              projectStructure: '',
              gettingStarted: '',
              mainFiles: [],
              complexity: 'Low',
              estimatedReadingTime: 'Unknown',
              futureScope: 'No future scope provided.',
              roadmap: []
            },
            nonTechnicalSummary: 'An error occurred with the AI response. Please try again.'
          };
        }
      } else {
        console.error('No JSON block found in AI response.');
        // Fallback for cases where no JSON block is returned
        return {
          technicalSummary: {
            overview: 'Unable to parse technical summary.',
            keyFeatures: [],
            techStack: [],
            projectStructure: '',
            gettingStarted: '',
            mainFiles: [],
            complexity: 'Low',
            estimatedReadingTime: 'Unknown',
            futureScope: 'No future scope provided.',
            roadmap: []
          },
          nonTechnicalSummary: 'An error occurred with the AI response. Please try again.'
        };
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      
      // General fallback summaries for any other errors
      return {
        technicalSummary: {
          overview: 'Unable to generate technical summary due to a service error.',
          keyFeatures: [],
          techStack: [],
          projectStructure: '',
          gettingStarted: '',
          mainFiles: [],
          complexity: 'Low',
          estimatedReadingTime: 'Unknown',
          futureScope: 'No future scope provided.',
          roadmap: [],
          pitchDeck: 'Not available'
        },
        nonTechnicalSummary: 'Unable to generate non-technical summary due to a service error.'
      };
    }
  }
}

export const geminiService = new GeminiService();