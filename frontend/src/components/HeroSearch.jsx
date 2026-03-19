import React, { useState } from 'react';

const HeroSearch = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 className="hero-title">RepoXplain</h1>
      <p className="hero-subtitle">Instantly analyze, visualize, and unravel any GitHub repository.</p>
      
      <form className="search-container" onSubmit={handleSubmit}>
        <input 
          type="url" 
          className="search-input" 
          placeholder="Paste GitHub repository URL..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" className="analyze-btn" disabled={isLoading}>
          {isLoading ? <span className="loader"></span> : 'Analyze'}
        </button>
      </form>
    </div>
  );
};

export default HeroSearch;
