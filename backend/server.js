const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = 80; // We will run Express natively on Port 80!

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
        return null;
    }
    return null;
};

// POST endpoint to analyze GitHub repo
app.post('/api/analyze', async (req, res) => {
    const { repoUrl } = req.body;
    
    if (!repoUrl) return res.status(400).json({ error: 'Repository URL is required.' });

    const repoInfo = parseGitHubUrl(repoUrl);
    
    if (!repoInfo) return res.status(400).json({ error: 'Invalid GitHub repository URL format.' });

    try {
        const { owner, repo } = repoInfo;
        
        const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
        const defaultBranch = repoResponse.data.default_branch;

        const treeResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
        );

        res.json({ owner, repo, defaultBranch, tree: treeResponse.data.tree });
    } catch (error) {
        console.error('GitHub API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch repository data.' });
    }
});

// --- NEW ENHANCEMENT ---
// Tell Express to serve the compiled React frontend directly to the user
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback: If a user refreshes a React route or accesses root, hand them the React HTML wrapper
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`RepoXplain Unified Server is running on port ${PORT}`);
});
