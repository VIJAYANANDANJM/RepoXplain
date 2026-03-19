const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 5000;
const githubHeaders = {
    Accept: 'application/vnd.github+json',
    ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {})
};

// Initialize Gemini AI (1.5-flash has the most generous free tier — 1500 req/day)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Supported file extensions for content fetching
const SUPPORTED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.json', '.css', '.html',
    '.md', '.yml', '.yaml', '.xml', '.go', '.rs', '.rb', '.php', '.c',
    '.cpp', '.h', '.sh', '.bat', '.sql', '.env', '.toml', '.cfg', '.ini',
    '.txt', '.csv', '.dockerfile', '.groovy'
];

// ─── Helper Functions ───────────────────────────────────────────────

const parseGitHubUrl = (url) => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (urlObj.hostname === 'github.com' && pathParts.length >= 2) {
            return { owner: pathParts[0], repo: pathParts[1] };
        }
    } catch (error) {
        return null;
    }
    return null;
};

const getFileExtension = (filePath) => {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot !== -1 ? filePath.slice(lastDot).toLowerCase() : '';
};

const detectTechStack = (tree) => {
    const fileNames = tree.map(f => f.path.split('/').pop().toLowerCase());
    const techs = [];

    const checks = [
        { files: ['package.json'], name: 'Node.js', icon: '🟢' },
        { files: ['requirements.txt', 'setup.py', 'pyproject.toml'], name: 'Python', icon: '🐍' },
        { files: ['pom.xml', 'build.gradle'], name: 'Java', icon: '☕' },
        { files: ['go.mod'], name: 'Go', icon: '🐹' },
        { files: ['cargo.toml'], name: 'Rust', icon: '🦀' },
        { files: ['gemfile'], name: 'Ruby', icon: '💎' },
        { files: ['composer.json'], name: 'PHP', icon: '🐘' },
        { files: ['dockerfile', 'docker-compose.yml', 'docker-compose.yaml'], name: 'Docker', icon: '🐳' },
        { files: ['jenkinsfile'], name: 'Jenkins CI/CD', icon: '🔧' },
        { files: ['.github'], name: 'GitHub Actions', icon: '⚙️' },
        { files: ['nginx.conf'], name: 'Nginx', icon: '🌐' },
        { files: ['vite.config.js', 'vite.config.ts'], name: 'Vite', icon: '⚡' },
        { files: ['next.config.js', 'next.config.mjs'], name: 'Next.js', icon: '▲' },
        { files: ['tsconfig.json'], name: 'TypeScript', icon: '🔷' },
        { files: ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js'], name: 'ESLint', icon: '📏' },
    ];

    // Check for React by looking at any .jsx or .tsx files
    const hasReact = tree.some(f => f.path.endsWith('.jsx') || f.path.endsWith('.tsx'));
    if (hasReact) techs.push({ name: 'React', icon: '⚛️' });

    checks.forEach(check => {
        if (check.files.some(f => fileNames.includes(f) || tree.some(t => t.path.toLowerCase().includes(f)))) {
            techs.push({ name: check.name, icon: check.icon });
        }
    });

    return [...new Map(techs.map(t => [t.name, t])).values()];
};

// ─── API Routes ─────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        service: 'repoxplain-backend',
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Phase 1: Analyze repository structure
app.post('/api/analyze', async (req, res) => {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'Repository URL is required.' });

    const repoInfo = parseGitHubUrl(repoUrl);
    if (!repoInfo) return res.status(400).json({ error: 'Invalid GitHub repository URL format.' });

    try {
        const { owner, repo } = repoInfo;
        const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: githubHeaders
        });
        const defaultBranch = repoResponse.data.default_branch;
        const description = repoResponse.data.description || '';
        const language = repoResponse.data.language || '';

        const treeResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
            { headers: githubHeaders }
        );

        res.json({ owner, repo, defaultBranch, description, language, tree: treeResponse.data.tree });
    } catch (error) {
        console.error('GitHub API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch repository data.' });
    }
});

// Phase 2: Fetch file content
app.post('/api/file-content', async (req, res) => {
    const { owner, repo, path, branch } = req.body;
    if (!owner || !repo || !path) return res.status(400).json({ error: 'owner, repo, and path are required.' });

    const ext = getFileExtension(path);
    if (!SUPPORTED_EXTENSIONS.includes(ext) && ext !== '') {
        return res.status(400).json({ error: `Unsupported file type: ${ext}` });
    }

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ''}`,
            { headers: githubHeaders }
        );

        if (response.data.encoding === 'base64') {
            const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
            res.json({ content, size: response.data.size, name: response.data.name, path: response.data.path });
        } else {
            res.status(400).json({ error: 'File content is not base64 encoded (likely binary).' });
        }
    } catch (error) {
        console.error('File fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch file content.' });
    }
});

// Phase 2: AI Explanation of a file
app.post('/api/explain', async (req, res) => {
    const { code, fileName } = req.body;
    if (!code || !fileName) return res.status(400).json({ error: 'code and fileName are required.' });

    try {
        const prompt = `You are a senior software engineer. Analyze this file named "${fileName}" and provide a structured explanation in JSON format with these exact keys:
{
  "purpose": "What this file does in 2-3 sentences",
  "keyFunctions": ["list of key functions/classes and what each does"],
  "connections": "How this file connects to or is used by other parts of the project",
  "complexity": "simple | moderate | complex"
}

Here is the code:
\`\`\`
${code.substring(0, 15000)}
\`\`\`

Respond ONLY with valid JSON, no markdown fences.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Try to parse the JSON response
        let explanation;
        try {
            // Strip markdown code fences if Gemini adds them
            const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
            explanation = JSON.parse(cleaned);
        } catch {
            explanation = {
                purpose: text,
                keyFunctions: [],
                connections: 'Could not parse structured response.',
                complexity: 'moderate'
            };
        }

        res.json(explanation);
    } catch (error) {
        console.error('AI Explanation Error:', error.message);
        res.status(500).json({ error: 'Failed to generate AI explanation. Check your GEMINI_API_KEY.' });
    }
});

// Phase 3: Project summary
app.post('/api/summarize', async (req, res) => {
    const { owner, repo, tree, description, language } = req.body;
    if (!tree) return res.status(400).json({ error: 'tree is required.' });

    const techStack = detectTechStack(tree);
    const fileList = tree
        .filter(f => f.type === 'blob')
        .map(f => f.path)
        .slice(0, 200)
        .join('\n');

    try {
        const prompt = `You are a senior developer analyzing a GitHub repository called "${owner}/${repo}".
${description ? `Description: ${description}` : ''}
${language ? `Primary Language: ${language}` : ''}
Detected Technologies: ${techStack.map(t => t.name).join(', ')}

Here is the file structure (up to 200 files):
${fileList}

Provide a structured summary in JSON with these exact keys:
{
  "overview": "3-4 sentence summary of what this project does",
  "architecture": "Explain the project architecture and how components connect",
  "howToRun": "Step-by-step instructions to run this project locally",
  "highlights": ["3-5 notable features or interesting aspects of this codebase"]
}

Respond ONLY with valid JSON, no markdown fences.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        let summary;
        try {
            const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
            summary = JSON.parse(cleaned);
        } catch {
            summary = { overview: text, architecture: '', howToRun: '', highlights: [] };
        }

        res.json({ ...summary, techStack });
    } catch (error) {
        console.error('Summarize Error:', error.message);
        res.status(500).json({ error: 'Failed to generate project summary.' });
    }
});

// Phase 4: Complexity score
app.post('/api/complexity', async (req, res) => {
    const { tree } = req.body;
    if (!tree) return res.status(400).json({ error: 'tree is required.' });

    const files = tree.filter(f => f.type === 'blob');
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const estimatedLines = Math.round(totalSize / 40); // rough estimate

    // Language breakdown
    const langMap = {};
    files.forEach(f => {
        const ext = getFileExtension(f.path);
        if (ext) {
            langMap[ext] = (langMap[ext] || 0) + 1;
        }
    });

    const languages = Object.entries(langMap)
        .map(([ext, count]) => ({ extension: ext, count, percentage: Math.round((count / totalFiles) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const folders = tree.filter(f => f.type === 'tree').length;

    let score = 'Small';
    if (totalFiles > 500) score = 'Very Large';
    else if (totalFiles > 200) score = 'Large';
    else if (totalFiles > 50) score = 'Medium';

    res.json({ totalFiles, totalSize, estimatedLines, folders, languages, score });
});

// Phase 4: Dependency graph
app.post('/api/dependencies', async (req, res) => {
    const { owner, repo, branch, tree } = req.body;
    if (!owner || !repo || !tree) return res.status(400).json({ error: 'owner, repo, and tree are required.' });

    const sourceFiles = tree
        .filter(f => f.type === 'blob' && /\.(js|jsx|ts|tsx|py|java)$/.test(f.path))
        .slice(0, 30); // Limit to 30 files to avoid rate limits

    const edges = [];

    for (const file of sourceFiles) {
        try {
            const response = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}${branch ? `?ref=${branch}` : ''}`,
                { headers: githubHeaders }
            );
            if (response.data.encoding === 'base64') {
                const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

                // Parse import/require statements
                const importRegex = /(?:import\s+.*?from\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\))/g;
                let match;
                while ((match = importRegex.exec(content)) !== null) {
                    const dep = match[1] || match[2];
                    if (dep.startsWith('.')) {
                        edges.push({ source: file.path, target: dep });
                    }
                }
            }
        } catch {
            // Skip files that can't be fetched
        }
    }

    res.json({ edges, fileCount: sourceFiles.length });
});

app.listen(PORT, HOST, () => {
    console.log(`RepoXplain Backend server is running on http://${HOST}:${PORT}`);
});
