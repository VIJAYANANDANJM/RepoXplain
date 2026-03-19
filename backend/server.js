const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

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

app.use(cors());
app.use(express.json());

// Helper function to extract owner and repo from URL
const parseGitHubUrl = (url) => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (urlObj.hostname === 'github.com' && pathParts.length >= 2) {
            return { owner: pathParts[0], repo: pathParts[1] };
        }
    } catch (error) {
        return null; // Invalid URL
    }
    return null; // Not github.com or missing parts
};

app.get('/api/health', (_req, res) => {
    res.json({
        service: 'repoxplain-backend',
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// POST endpoint to analyze GitHub repo
app.post('/api/analyze', async (req, res) => {
    const { repoUrl } = req.body;
    
    if (!repoUrl) {
        return res.status(400).json({ error: 'Repository URL is required.' });
    }

    const repoInfo = parseGitHubUrl(repoUrl);
    
    if (!repoInfo) {
        return res.status(400).json({ error: 'Invalid GitHub repository URL format.' });
    }

    try {
        const { owner, repo } = repoInfo;
        
        // 1. Get fundamental repo details to find its default branch
        const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: githubHeaders
        });
        const defaultBranch = repoResponse.data.default_branch;

        // 2. Get full file tree recursively
        const treeResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
            { headers: githubHeaders }
        );

        res.json({
            owner,
            repo,
            defaultBranch,
            tree: treeResponse.data.tree
        });
    } catch (error) {
        console.error('GitHub API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch repository data. The repository might be private, non-existent, or we hit a GitHub API rate limit.' 
        });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`RepoXplain Backend server is running on http://${HOST}:${PORT}`);
});
