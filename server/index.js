// // project/server/index.js
// import simpleGit from 'simple-git';
// import fs, { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
// import path from 'path';
// import express from 'express';
// import cors from 'cors';
// import multer from 'multer';
// import { fileURLToPath } from 'url';

// // --- ES Module setup ---
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const PROJECTS_PATH = path.join(__dirname, 'projects.json');
// const TEMP_REPO_DIR = path.join(__dirname, 'temp_repos');

// // Ensure temp folder exists
// if (!existsSync(TEMP_REPO_DIR)) fs.mkdirSync(TEMP_REPO_DIR, { recursive: true });

// const app = express();
// const upload = multer({ dest: 'uploads/' });

// app.use(cors());
// app.use(express.json());

// // ========================
// // Helper Functions
// // ========================

// // Mock AI analysis
// async function mock_call_gemini_analysis(fileContents) {
//   const numFiles = Object.keys(fileContents).length;
//   const hasTests = Object.keys(fileContents).some(f => f.includes('test'));
//   const hasDocs = Object.keys(fileContents).some(f => f.toLowerCase().includes('readme'));
//   let keyIssue = "High risk of breaking changes due to poor variable naming in core logic.";
//   if (fileContents['src/auth.js']?.includes('TODO')) {
//     keyIssue = "Authentication module (src/auth.js) contains unhandled error cases and TODOs for token refresh.";
//   }
//   return {
//     summary: `The project contains ${numFiles} files. It appears to be a basic Node.js service focusing on API endpoints.`,
//     qualityReport: {
//       hasUnitTests: hasTests ? "Partial" : "No",
//       hasDocumentation: hasDocs ? "Basic" : "Missing",
//       complexityRating: "Medium",
//     },
//     criticalIssues: [keyIssue, "Logging mechanism is inconsistent across files."],
//     suggestedFeatures: ["Implement a rate-limiter for API endpoints.", "Migrate to TypeScript for better type safety."]
//   };
// }

// // Recursively get all files
// function getAllFiles(dir, fileList = []) {
//   if (!existsSync(dir)) return fileList;
//   const files = readdirSync(dir);
//   for (const file of files) {
//     const fullPath = path.join(dir, file);
//     if (['node_modules', '.git'].includes(file)) continue;
//     if (statSync(fullPath).isDirectory()) getAllFiles(fullPath, fileList);
//     else fileList.push(fullPath);
//   }
//   return fileList;
// }

// /**
//  * Clones repository if it doesn't exist, otherwise does nothing.
//  * @param {string} repoUrl - The URL of the Git repository.
//  * @param {string} targetDir - The local directory path for the clone.
//  * @returns {Promise<boolean>} - True if a new clone happened, false otherwise.
//  */
// async function cloneRepoOnce(repoUrl, targetDir) {
//   if (existsSync(targetDir)) {
//     console.log(`Repository already cloned to ${targetDir}. Skipping clone.`);
//     return false;
//   }
  
//   const git = simpleGit();
//   fs.mkdirSync(targetDir, { recursive: true });
//   await git.clone(repoUrl, targetDir);
//   console.log(`Successfully cloned repository to ${targetDir}.`);
//   return true;
// }

// // Analyze repo health
// async function analyzeRepoHealth(targetDir) {
//   const git = simpleGit(targetDir);
//   try {
//     const log = await git.log();
//     return {
//       totalCommits: log.total || 0,
//       contributors: log.all ? [...new Set(log.all.map(c => c.author_name))].length : 0,
//       lastCommitDate: log.latest?.date || null,
//       latestCommitMsg: log.latest?.message || 'No commits',
//       daysSinceLastCommit: log.latest ? Math.floor((Date.now() - new Date(log.latest.date)) / (1000*60*60*24)) : null,
//       active: (log.total || 0) > 0
//     };
//   } catch (e) {
//     return {
//       totalCommits: 0, contributors: 0, lastCommitDate: null,
//       latestCommitMsg: 'No commits', daysSinceLastCommit: null, active: false
//     };
//   }
// }

// // Analyze branch health
// async function analyzeBranchHealth(targetDir) {
//   const git = simpleGit(targetDir);
//   try {
//     const branches = await git.branch();
//     const allBranches = Array.isArray(branches.all) ? branches.all : Object.values(branches.all || []);
//     const mergedArr = Array.isArray(branches.merged) ? branches.merged : [];
//     const mergedCount = allBranches.filter(b => mergedArr.includes(b)).length;
//     return {
//       totalBranches: allBranches.length,
//       merged: mergedCount,
//       unmerged: Math.max(0, allBranches.length - mergedCount),
//       active: allBranches.length > 0,
//       stale: 0,
//       activeBranches: allBranches,
//       staleBranches: []
//     };
//   } catch (e) {
//     return { totalBranches: 0, merged: 0, unmerged: 0, active: false, stale: 0, activeBranches: [], staleBranches: [] };
//   }
// }

// // Analyze code files (AI)
// async function analyzeCodebaseAI(targetDir) {
//   const files = getAllFiles(targetDir);
//   const fileContents = {};
//   files.forEach(f => {
//     try { fileContents[path.relative(targetDir, f)] = readFileSync(f, 'utf-8'); }
//     catch(e){ fileContents[path.relative(targetDir, f)] = ''; }
//   });
//   return await mock_call_gemini_analysis(fileContents);
// }

// // Generate next steps roadmap
// function generateNextSteps(projectReport) {
//   return projectReport.suggestedFeatures || [];
// }

// // Calculate health score
// function calculateHealthScore(repoStats, branchStats, projectReport) {
//   let score = 50;
//   if (projectReport.qualityReport.hasUnitTests !== "No") score += 10;
//   if (projectReport.qualityReport.hasDocumentation !== "Missing") score += 10;
//   if (branchStats.active > 0) score += 10;
//   return Math.min(score, 100);
// }

// // Master function
// async function generateFullProjectReport(targetDir) {
//   const repoStats = await analyzeRepoHealth(targetDir);
//   const branchStats = await analyzeBranchHealth(targetDir);
//   const projectReport = await analyzeCodebaseAI(targetDir);
//   const roadmap = generateNextSteps(projectReport);
//   const healthScore = calculateHealthScore(repoStats, branchStats, projectReport);
//   return { repoStats, branchStats, projectReport, roadmap, healthScore };
// }

// // ========================
// // Routes
// // ========================

// // GET all projects
// app.get('/projects', (req, res) => {
//   let projects = [];
//   if (existsSync(PROJECTS_PATH)) projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
//   res.json(projects);
// });

// // POST /analyze (upload files + formData)
// app.post('/analyze', upload.array('files'), async (req, res) => {
//   try {
//     const formData = req.body.formData ? JSON.parse(req.body.formData) : {};
//     const files = req.files || [];

//     const project = {
//       ...formData,
//       files: files.map(f => ({
//         originalname: f.originalname,
//         filename: f.filename,
//         mimetype: f.mimetype,
//         size: f.size
//       })),
//       createdAt: new Date().toISOString(),
//       id: Date.now().toString(),
//     };

//     let projects = [];
//     if (existsSync(PROJECTS_PATH)) projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
//     projects.push(project);
//     writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));

//     res.json({ success: true, project });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // GET /project-report/:id
// app.get('/project-report/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!existsSync(PROJECTS_PATH)) return res.status(404).json({ error: 'No projects found' });

//     const projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
//     const project = projects.find(p => p.id === id);
//     if (!project) return res.status(404).json({ error: 'Project not found' });

//     let fullReport;
//     const githubUrl = project.githubUrl || null;
//     console.log('Generating report for project id:', id, 'githubUrl:', githubUrl);

//     if (githubUrl) {
//       // 1. Create a stable, predictable tempDir name using only the project ID.
//       const tempDir = path.join(TEMP_REPO_DIR, project.id); 
      
//       try {
//         // 2. Use the new function that only clones if the directory doesn't exist.
//         await cloneRepoOnce(githubUrl, tempDir);
//         fullReport = await generateFullProjectReport(tempDir);
        
//       } catch (cloneErr) {
//         console.error('Git operation failed (clone/analysis), falling back to uploaded files:', cloneErr.message);

//         // Fallback logic remains the same for uploaded files
//         const uploadDir = path.join(__dirname, 'uploads', project.id);
//         if (!existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

//         if (project.files && project.files.length > 0) {
//           for (const f of project.files) {
//             const src = path.join(__dirname, 'uploads', f.filename);
//             const dest = path.join(uploadDir, f.originalname);
//             if (existsSync(src)) fs.copyFileSync(src, dest);
//           }
//         }
//         fullReport = await generateFullProjectReport(uploadDir);
//       }
//       // NOTE: Removed the 'finally' block that deleted 'tempDir' to ensure the cloned repository persists for future requests.
//     } else {
//       // Logic for non-GitHub projects (uploaded files)
//       const uploadDir = path.join(__dirname, 'uploads', project.id);
//       fullReport = await generateFullProjectReport(uploadDir);
//     }

//     res.json(fullReport);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Start server
// app.listen(5000, () => console.log('Server started on port 5000'));






// project/server/index.js
// import simpleGit from 'simple-git';
// import fs, { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
// import path from 'path';
// import express from 'express';
// import cors from 'cors';
// import multer from 'multer';
// import { fileURLToPath } from 'url';

// // --- ES Module setup ---
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const PROJECTS_PATH = path.join(__dirname, 'projects.json');
// const TEMP_REPO_DIR = path.join(__dirname, 'temp_repos');

// // Ensure temp folder exists
// if (!existsSync(TEMP_REPO_DIR)) fs.mkdirSync(TEMP_REPO_DIR, { recursive: true });

// const app = express();
// const upload = multer({ dest: 'uploads/' });

// app.use(cors());
// app.use(express.json());

// // ========================
// // Helper Functions
// // ========================

// // Mock AI analysis
// async function mock_call_gemini_analysis(fileContents) {
//   const numFiles = Object.keys(fileContents).length;
//   const hasTests = Object.keys(fileContents).some(f => f.includes('test'));
//   const hasDocs = Object.keys(fileContents).some(f => f.toLowerCase().includes('readme'));
//   let keyIssue = "High risk of breaking changes due to poor variable naming in core logic.";
//   if (fileContents['src/auth.js']?.includes('TODO')) {
//     keyIssue = "Authentication module (src/auth.js) contains unhandled error cases and TODOs for token refresh.";
//   }
//   return {
//     summary: `The project contains ${numFiles} files. It appears to be a basic Node.js service focusing on API endpoints.`,
//     qualityReport: {
//       hasUnitTests: hasTests ? "Partial" : "No",
//       hasDocumentation: hasDocs ? "Basic" : "Missing",
//       complexityRating: "Medium",
//     },
//     criticalIssues: [keyIssue, "Logging mechanism is inconsistent across files."],
//     suggestedFeatures: ["Implement a rate-limiter for API endpoints.", "Migrate to TypeScript for better type safety."]
//   };
// }

// // Recursively get all files
// function getAllFiles(dir, fileList = []) {
//   if (!existsSync(dir)) return fileList;
//   const files = readdirSync(dir);
//   for (const file of files) {
//     const fullPath = path.join(dir, file);
//     if (['node_modules', '.git'].includes(file)) continue;
//     if (statSync(fullPath).isDirectory()) getAllFiles(fullPath, fileList);
//     else fileList.push(fullPath);
//   }
//   return fileList;
// }

// /**
//  * Clones repository if it doesn't exist, otherwise does nothing (ONLY ONCE).
//  * @param {string} repoUrl - The URL of the Git repository.
//  * @param {string} targetDir - The local directory path for the clone.
//  */
// async function cloneRepoOnce(repoUrl, targetDir) {
//   if (existsSync(targetDir)) {
//     console.log(`ℹ️ Repository already cloned to ${targetDir}. Skipping clone.`);
//     return true;
//   }
  
//   const git = simpleGit();
//   fs.mkdirSync(targetDir, { recursive: true });
//   await git.clone(repoUrl, targetDir);
//   console.log(`✅ Successfully cloned repository to ${targetDir}.`);
//   return true;
// }

// // Analyze repo health
// async function analyzeRepoHealth(targetDir) {
//   const git = simpleGit(targetDir);
//   try {
//     const log = await git.log();
//     return {
//       totalCommits: log.total || 0,
//       contributors: log.all ? [...new Set(log.all.map(c => c.author_name))].length : 0,
//       lastCommitDate: log.latest?.date || null,
//       latestCommitMsg: log.latest?.message || 'No commits',
//       daysSinceLastCommit: log.latest ? Math.floor((Date.now() - new Date(log.latest.date)) / (1000*60*60*24)) : null,
//       active: (log.total || 0) > 0
//     };
//   } catch (e) {
//     return {
//       totalCommits: 0, contributors: 0, lastCommitDate: null,
//       latestCommitMsg: 'No commits', daysSinceLastCommit: null, active: false
//     };
//   }
// }

// // ========================
// // CORRECTED Branch Health Analysis
// // ========================
// async function analyzeBranchHealth(targetDir, baseBranch = 'main') {
//   const git = simpleGit(targetDir);
//   try {
//     await git.fetch(); // Ensure local data is up-to-date

//     // 1. Get all local branches
//     const branchResult = await git.branchLocal();
//     const allLocalBranches = branchResult.all || [];

//     // 2. Get branches merged into the base branch
//     const mergedResult = await git.branch(['--merged', baseBranch]);
//     const mergedBranches = mergedResult.all || [];

//     // 3. Get branches NOT merged into the base branch (unmerged)
//     const unmergedBranches = allLocalBranches.filter(b => !mergedBranches.includes(b));
    
//     // Determine active/stale status based on time (simplified approach)
//     let staleCount = 0;
//     const activeBranchesInfo = []; // List of unmerged branches for display

//     for (const branchName of allLocalBranches) {
//         if (branchName === branchResult.current) continue; // Skip current branch for stale check

//         try {
//             // Get last commit for the branch
//             const log = await git.log({ from: branchName, to: branchName, n: 1 });
//             if (log.latest) {
//                 const lastCommitDate = new Date(log.latest.date);
//                 const daysSince = Math.floor((Date.now() - lastCommitDate) / (1000 * 60 * 60 * 24));
                
//                 if (daysSince > 90) { // Definition of 'stale'
//                     staleCount++;
//                 }
//             }
//         } catch (e) {
//             // Can happen for remote-only or badly formed branches
//         }
//     }
    
//     // Populate activeBranches for display (only showing unmerged names for relevance)
//     unmergedBranches.forEach(branch => activeBranchesInfo.push(branch));

//     return {
//       totalBranches: allLocalBranches.length,
//       merged: mergedBranches.length,
//       unmerged: unmergedBranches.length,
//       active: activeBranchesInfo.length,
//       stale: staleCount,
//       // For display on the client (using the names of unmerged branches as 'active')
//       activeBranches: activeBranchesInfo.join(', '), 
//       staleBranches: [], 
//     };
//   } catch (e) {
//     console.error("Error analyzing branch health:", e.message);
//     return { totalBranches: 0, merged: 0, unmerged: 0, active: 0, stale: 0, activeBranches: '', staleBranches: [] };
//   }
// }

// // Analyze code files (AI)
// async function analyzeCodebaseAI(targetDir) {
//   const files = getAllFiles(targetDir);
//   const fileContents = {};
//   files.forEach(f => {
//     try { fileContents[path.relative(targetDir, f)] = readFileSync(f, 'utf-8'); }
//     catch(e){ fileContents[path.relative(targetDir, f)] = ''; }
//   });
//   return await mock_call_gemini_analysis(fileContents);
// }

// // Generate next steps roadmap
// function generateNextSteps(projectReport) {
//   return projectReport.suggestedFeatures || [];
// }

// // Calculate health score
// function calculateHealthScore(repoStats, branchStats, projectReport) {
//   let score = 50;
//   if (projectReport.qualityReport.hasUnitTests !== "No") score += 10;
//   if (projectReport.qualityReport.hasDocumentation !== "Missing") score += 10;
//   if (branchStats.active > 0) score += 10;
//   return Math.min(score, 100);
// }

// // Master function
// async function generateFullProjectReport(targetDir) {
//   const repoStats = await analyzeRepoHealth(targetDir);
//   const branchStats = await analyzeBranchHealth(targetDir);
//   const projectReport = await analyzeCodebaseAI(targetDir);
//   const roadmap = generateNextSteps(projectReport);
//   const healthScore = calculateHealthScore(repoStats, branchStats, projectReport);
//   return { repoStats, branchStats, projectReport, roadmap, healthScore };
// }

// // ========================
// // Routes
// // ========================

// // GET all projects
// app.get('/projects', (req, res) => {
//   let projects = [];
//   if (existsSync(PROJECTS_PATH)) projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
//   res.json(projects);
// });

// // POST /analyze (upload files + formData)
// app.post('/analyze', upload.array('files'), async (req, res) => {
//   try {
//     const formData = req.body.formData ? JSON.parse(req.body.formData) : {};
//     const files = req.files || [];

//     const project = {
//       ...formData,
//       files: files.map(f => ({
//         originalname: f.originalname,
//         filename: f.filename,
//         mimetype: f.mimetype,
//         size: f.size
//       })),
//       createdAt: new Date().toISOString(),
//       id: Date.now().toString(),
//     };

//     let projects = [];
//     if (existsSync(PROJECTS_PATH)) projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
//     projects.push(project);
//     writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));

//     res.json({ success: true, project });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // GET /project-report/:id
// app.get('/project-report/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!existsSync(PROJECTS_PATH)) return res.status(404).json({ error: 'No projects found' });

//     const projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
//     const project = projects.find(p => p.id === id);
//     if (!project) return res.status(404).json({ error: 'Project not found' });

//     let fullReport;
//     const githubUrl = project.githubUrl || null;
//     console.log('Generating report for project id:', id, 'githubUrl:', githubUrl);

//     if (githubUrl) {
//       // Use stable directory name for "clone only once"
//       const tempDir = path.join(TEMP_REPO_DIR, project.id); 

//       try {
//         // Use the cloneRepoOnce function to prevent re-cloning
//         await cloneRepoOnce(githubUrl, tempDir);
//         fullReport = await generateFullProjectReport(tempDir);
//       } catch (cloneErr) {
//         console.error('Git operation failed (clone/analysis), falling back to uploaded files:', cloneErr.message);

//         // Fallback logic remains the same for uploaded files
//         const uploadDir = path.join(__dirname, 'uploads', project.id);
//         if (!existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

//         if (project.files && project.files.length > 0) {
//           for (const f of project.files) {
//             const src = path.join(__dirname, 'uploads', f.filename);
//             const dest = path.join(uploadDir, f.originalname);
//             if (existsSync(src)) fs.copyFileSync(src, dest);
//           }
//         }
//         fullReport = await generateFullProjectReport(uploadDir);
//       }
//       // NO finally block to remove tempDir, ensuring the clone persists
//     } else {
//       // Logic for non-GitHub projects (uploaded files)
//       const uploadDir = path.join(__dirname, 'uploads', project.id);
//       fullReport = await generateFullProjectReport(uploadDir);
//     }

//     res.json(fullReport);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Start server
// app.listen(5000, () => console.log('Server started on port 5000'));









// project/server/index.js
import simpleGit from 'simple-git';
import fs, { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();
// GitHub token (should be set in environment)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

// --- Stripe Setup ---
const stripe = new Stripe("sk_test_51SBasvBUadzr6Wd84EXD1rIeDz7CoXKk0qpkI2SUdJOSVufASwN7fsOpMfzX3iIRuspHp5dLPqpm53dVQRh1b80600rJBXFU72");

// --- ES Module setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECTS_PATH = path.join(__dirname, 'projects.json');
const TEMP_REPO_DIR = path.join(__dirname, 'temp_repos');

// Ensure temp folder exists
if (!existsSync(TEMP_REPO_DIR)) fs.mkdirSync(TEMP_REPO_DIR, { recursive: true });

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Helper to call GitHub API with optional server-side token
async function callGithubApi(url, opts = {}) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'EngiVerse'
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers, ...opts });
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await response.json();
    return { status: response.status, body: json };
  }
  const text = await response.text();
  return { status: response.status, body: text };
}

// -------------------------
// GitHub proxy routes (server-side token used)
// -------------------------
// Get repository info
app.get('/api/github/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const r = await callGithubApi(url);
    res.status(r.status).json(r.body);
  } catch (err) {
    console.error('github repo error', err);
    res.status(500).json({ error: err.message });
  }
});

// List repository contents
app.get('/api/github/repos/:owner/:repo/contents', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const pathQuery = req.query.path ? `/${req.query.path}` : '';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents${pathQuery}`;
    const r = await callGithubApi(url);
    res.status(r.status).json(r.body);
  } catch (err) {
    console.error('github contents error', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch raw file by download_url OR by owner/repo/path
app.get('/api/github/file', async (req, res) => {
  try {
    const { download_url, owner, repo, path } = req.query;
    if (!download_url && !(owner && repo && path)) {
      return res.status(400).json({ error: 'download_url OR owner+repo+path required' });
    }
    // Prefer fetching via the GitHub content API when we have owner/repo/path
    if (owner && repo && path) {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const r = await callGithubApi(apiUrl);
      if (r.status !== 200) return res.status(r.status).json(r.body);
      // If API returned JSON with 'content' (base64), decode it.
      if (r.body && r.body.content) {
        const decoded = Buffer.from(r.body.content, 'base64').toString('utf-8');
        return res.status(200).send(decoded);
      }
      // Otherwise return JSON
      return res.status(200).json(r.body);
    }

    // If only download_url is provided, attempt to fetch raw content directly; if it fails fallback to attempting to extract details.
    try {
      const raw = await callGithubApi(download_url);
      if (typeof raw.body === 'string') return res.status(raw.status).send(raw.body);
      return res.status(raw.status).json(raw.body);
    } catch (ex) {
      // Try to extract owner/repo/path from the URL as a fallback
      const m = /raw\.githubusercontent\.com\/(.*?)\/(.*?)\/(?:[^\/]+)\/(.*)$/i.exec(download_url);
      if (m && m.length >= 4) {
        const fallbackOwner = m[1];
        const fallbackRepo = m[2];
        const fallbackPath = m[3];
        const apiUrl = `https://api.github.com/repos/${fallbackOwner}/${fallbackRepo}/contents/${fallbackPath}`;
        const r2 = await callGithubApi(apiUrl);
        if (r2.status !== 200) return res.status(r2.status).json(r2.body);
        if (r2.body && r2.body.content) {
          const decoded = Buffer.from(r2.body.content, 'base64').toString('utf-8');
          return res.status(200).send(decoded);
        }
        return res.status(200).json(r2.body);
      }
      return res.status(500).json({ error: 'Unable to fetch file content' });
    }
  } catch (err) {
    console.error('github file error', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Helper Functions
// ========================

// Mock AI analysis
async function mock_call_gemini_analysis(fileContents) {
  const numFiles = Object.keys(fileContents).length;
  const hasTests = Object.keys(fileContents).some(f => f.includes('test'));
  const hasDocs = Object.keys(fileContents).some(f => f.toLowerCase().includes('readme'));
  let keyIssue = "High risk of breaking changes due to poor variable naming in core logic.";
  if (fileContents['src/auth.js']?.includes('TODO')) {
    keyIssue = "Authentication module (src/auth.js) contains unhandled error cases and TODOs for token refresh.";
  }
  return {
    summary: `The project contains ${numFiles} files. It appears to be a basic Node.js service focusing on API endpoints.`,
    qualityReport: {
      hasUnitTests: hasTests ? "Partial" : "No",
      hasDocumentation: hasDocs ? "Basic" : "Missing",
      complexityRating: "Medium",
    },
    criticalIssues: [keyIssue, "Logging mechanism is inconsistent across files."],
    suggestedFeatures: ["Implement a rate-limiter for API endpoints.", "Migrate to TypeScript for better type safety."]
  };
}

// Recursively get all files
function getAllFiles(dir, fileList = []) {
  if (!existsSync(dir)) return fileList;
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (['node_modules', '.git'].includes(file)) continue;
    if (statSync(fullPath).isDirectory()) getAllFiles(fullPath, fileList);
    else fileList.push(fullPath);
  }
  return fileList;
}

// Clone repo only once
async function cloneRepoOnce(repoUrl, targetDir) {
  if (existsSync(targetDir)) {
    console.log(`ℹ️ Repository already cloned to ${targetDir}. Skipping clone.`);
    return true;
  }
  const git = simpleGit();
  fs.mkdirSync(targetDir, { recursive: true });
  await git.clone(repoUrl, targetDir);
  console.log(`✅ Successfully cloned repository to ${targetDir}.`);
  return true;
}

// Analyze repo health
async function analyzeRepoHealth(targetDir) {
  const git = simpleGit(targetDir);
  try {
    const log = await git.log();
    return {
      totalCommits: log.total || 0,
      contributors: log.all ? [...new Set(log.all.map(c => c.author_name))].length : 0,
      lastCommitDate: log.latest?.date || null,
      latestCommitMsg: log.latest?.message || 'No commits',
      daysSinceLastCommit: log.latest ? Math.floor((Date.now() - new Date(log.latest.date)) / (1000*60*60*24)) : null,
      active: (log.total || 0) > 0
    };
  } catch (e) {
    return {
      totalCommits: 0, contributors: 0, lastCommitDate: null,
      latestCommitMsg: 'No commits', daysSinceLastCommit: null, active: false
    };
  }
}

// Corrected Branch Health Analysis
async function analyzeBranchHealth(targetDir, baseBranch = 'main') {
  const git = simpleGit(targetDir);
  try {
    await git.fetch(); // Ensure up-to-date
    const branchResult = await git.branchLocal();
    const allLocalBranches = branchResult.all || [];
    const mergedResult = await git.branch(['--merged', baseBranch]);
    const mergedBranches = mergedResult.all || [];
    const unmergedBranches = allLocalBranches.filter(b => !mergedBranches.includes(b));

    let staleCount = 0;
    const activeBranchesInfo = [];
    for (const branchName of allLocalBranches) {
      if (branchName === branchResult.current) continue;
      try {
        const log = await git.log({ from: branchName, to: branchName, n: 1 });
        if (log.latest) {
          const daysSince = Math.floor((Date.now() - new Date(log.latest.date)) / (1000*60*60*24));
          if (daysSince > 90) staleCount++;
        }
      } catch {}
    }

    unmergedBranches.forEach(branch => activeBranchesInfo.push(branch));

    return {
      totalBranches: allLocalBranches.length,
      merged: mergedBranches.length,
      unmerged: unmergedBranches.length,
      active: activeBranchesInfo.length,
      stale: staleCount,
      activeBranches: activeBranchesInfo.join(', '), 
      staleBranches: [],
    };
  } catch (e) {
    console.error("Error analyzing branch health:", e.message);
    return { totalBranches: 0, merged: 0, unmerged: 0, active: 0, stale: 0, activeBranches: '', staleBranches: [] };
  }
}

// Analyze codebase with AI
async function analyzeCodebaseAI(targetDir) {
  const files = getAllFiles(targetDir);
  const fileContents = {};
  files.forEach(f => {
    try { fileContents[path.relative(targetDir, f)] = readFileSync(f, 'utf-8'); }
    catch(e){ fileContents[path.relative(targetDir, f)] = ''; }
  });
  return await mock_call_gemini_analysis(fileContents);
}

// Generate next steps
function generateNextSteps(projectReport) {
  return projectReport.suggestedFeatures || [];
}

// Health score
function calculateHealthScore(repoStats, branchStats, projectReport) {
  let score = 50;
  if (projectReport.qualityReport.hasUnitTests !== "No") score += 10;
  if (projectReport.qualityReport.hasDocumentation !== "Missing") score += 10;
  if (branchStats.active > 0) score += 10;
  return Math.min(score, 100);
}

// Master report
async function generateFullProjectReport(targetDir) {
  const repoStats = await analyzeRepoHealth(targetDir);
  const branchStats = await analyzeBranchHealth(targetDir);
  const projectReport = await analyzeCodebaseAI(targetDir);
  const roadmap = generateNextSteps(projectReport);
  const healthScore = calculateHealthScore(repoStats, branchStats, projectReport);
  return { repoStats, branchStats, projectReport, roadmap, healthScore };
}

// ========================
// Routes
// ========================

// GET all projects
app.get('/projects', (req, res) => {
  let projects = [];
  if (existsSync(PROJECTS_PATH)) projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
  res.json(projects);
});

// POST /analyze
app.post('/analyze', upload.array('files'), async (req, res) => {
  try {
    const formData = req.body.formData ? JSON.parse(req.body.formData) : {};
    const files = req.files || [];

    const project = {
      ...formData,
      files: files.map(f => ({
        originalname: f.originalname,
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size
      })),
      createdAt: new Date().toISOString(),
      id: Date.now().toString(),
    };

    let projects = [];
    if (existsSync(PROJECTS_PATH)) projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
    projects.push(project);
    writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));

    res.json({ success: true, project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /project-report/:id
app.get('/project-report/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!existsSync(PROJECTS_PATH)) return res.status(404).json({ error: 'No projects found' });
    const projects = JSON.parse(readFileSync(PROJECTS_PATH, 'utf-8'));
    const project = projects.find(p => p.id === id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let fullReport;
    const githubUrl = project.githubUrl || null;
    const tempDir = path.join(TEMP_REPO_DIR, project.id);

    if (githubUrl) {
      try {
        await cloneRepoOnce(githubUrl, tempDir);
        fullReport = await generateFullProjectReport(tempDir);
      } catch (cloneErr) {
        console.error('Git clone/analysis failed, using uploaded files:', cloneErr.message);
        const uploadDir = path.join(__dirname, 'uploads', project.id);
        if (!existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        if (project.files) {
          for (const f of project.files) {
            const src = path.join(__dirname, 'uploads', f.filename);
            const dest = path.join(uploadDir, f.originalname);
            if (existsSync(src)) fs.copyFileSync(src, dest);
          }
        }
        fullReport = await generateFullProjectReport(uploadDir);
      }
    } else {
      const uploadDir = path.join(__dirname, 'uploads', project.id);
      fullReport = await generateFullProjectReport(uploadDir);
    }

    res.json(fullReport);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Stripe Checkout
app.post('/create-checkout-session', async (req, res) => {
  const { projectId, userId, projectTitle, ticketPrice } = req.body;
  if (!projectId || !userId || !projectTitle || !ticketPrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: { name: `${projectTitle} Funding`, description: `Funding for ${projectTitle}` },
          unit_amount: ticketPrice * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `http://localhost:3000/payment-success?projectId=${projectId}&userId=${userId}`,
      cancel_url: 'http://localhost:3000/cancel',
    });
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Start server
app.listen(5000, () => console.log('Server started on port 5000'));