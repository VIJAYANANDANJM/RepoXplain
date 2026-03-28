import React from 'react';

// Safely convert any value to a renderable string
const toText = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(toText).join(', ');
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${toText(v)}`)
      .join('\n');
  }
  return String(val);
};

const ProjectSummary = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="summary-container">
        <div className="summary-header">
          <h2>🧠 Project Intelligence</h2>
          <span className="summary-loading">Analyzing with AI...</span>
        </div>
        <div className="skeleton-block">
          <div className="skeleton-line" style={{ width: '100%' }}></div>
          <div className="skeleton-line" style={{ width: '90%' }}></div>
          <div className="skeleton-line" style={{ width: '80%' }}></div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>🧠 Project Intelligence</h2>
      </div>

      {/* Tech Stack Badges */}
      {summary.techStack && summary.techStack.length > 0 && (
        <div className="tech-badges">
          {summary.techStack.map((tech, i) => (
            <span key={i} className="tech-badge">
              {tech.icon} {tech.name}
            </span>
          ))}
        </div>
      )}

      {/* Overview */}
      {summary.overview && (
        <div className="summary-section">
          <h3>📋 Overview</h3>
          <p>{toText(summary.overview)}</p>
        </div>
      )}

      {/* Architecture */}
      {summary.architecture && (
        <div className="summary-section">
          <h3>🏗️ Architecture</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{toText(summary.architecture)}</p>
        </div>
      )}

      {/* How to Run */}
      {summary.howToRun && (
        <div className="summary-section">
          <h3>🚀 How to Run</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{toText(summary.howToRun)}</p>
        </div>
      )}

      {/* Highlights */}
      {summary.highlights && summary.highlights.length > 0 && (
        <div className="summary-section">
          <h3>✨ Highlights</h3>
          <ul>
            {summary.highlights.map((h, i) => (
              <li key={i}>{toText(h)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProjectSummary;
