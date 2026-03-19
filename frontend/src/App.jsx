import React, { useState } from 'react';
import HeroSearch from './components/HeroSearch';
import FileTree from './components/FileTree';

function App() {
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (url) => {
    setLoading(true);
    setError('');
    setRepoData(null);
    
    try {
      // Assuming backend is running on 5000 if not proxying
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch repository data');
      }
      
      setRepoData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <HeroSearch onAnalyze={handleAnalyze} isLoading={loading} />
      
      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #ff6b6b' }}>
          {error}
        </div>
      )}

      {repoData && <FileTree data={repoData} />}
    </div>
  );
}

export default App;
