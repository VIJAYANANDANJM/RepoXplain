import React from 'react';

const LANG_COLORS = {
  '.js': '#f1e05a', '.jsx': '#f1e05a', '.ts': '#3178c6', '.tsx': '#3178c6',
  '.py': '#3572A5', '.java': '#b07219', '.go': '#00ADD8', '.rs': '#dea584',
  '.rb': '#701516', '.php': '#4F5D95', '.css': '#563d7c', '.html': '#e34c26',
  '.json': '#292929', '.md': '#083fa1', '.yml': '#cb171e', '.yaml': '#cb171e',
  '.sh': '#89e051', '.sql': '#e38c00', '.c': '#555555', '.cpp': '#f34b7d',
};

const ComplexityScore = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="complexity-container">
        <h3>📊 Codebase Stats</h3>
        <div className="skeleton-block">
          <div className="skeleton-line" style={{ width: '60%' }}></div>
          <div className="skeleton-line" style={{ width: '80%' }}></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="complexity-container">
      <h3>📊 Codebase Stats</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.totalFiles}</span>
          <span className="stat-label">Files</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.folders}</span>
          <span className="stat-label">Folders</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.estimatedLines.toLocaleString()}</span>
          <span className="stat-label">Est. Lines</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.score}</span>
          <span className="stat-label">Scale</span>
        </div>
      </div>

      {/* Language breakdown bar */}
      {stats.languages && stats.languages.length > 0 && (
        <div className="lang-breakdown">
          <div className="lang-bar">
            {stats.languages.map((lang, i) => (
              <div
                key={i}
                className="lang-bar-segment"
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: LANG_COLORS[lang.extension] || '#8b949e',
                  minWidth: lang.percentage > 0 ? '4px' : '0'
                }}
                title={`${lang.extension} — ${lang.count} files (${lang.percentage}%)`}
              />
            ))}
          </div>
          <div className="lang-legend">
            {stats.languages.slice(0, 8).map((lang, i) => (
              <span key={i} className="lang-legend-item">
                <span className="lang-dot" style={{ backgroundColor: LANG_COLORS[lang.extension] || '#8b949e' }} />
                {lang.extension} <span className="text-muted">{lang.percentage}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplexityScore;
