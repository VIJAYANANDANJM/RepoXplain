import React from 'react';

const FileViewer = ({ file, content, explanation, isLoadingContent, isLoadingExplanation, onClose }) => {
  if (!file) return null;

  return (
    <div className="file-viewer-container">
      <div className="file-viewer-header">
        <div className="file-viewer-title">
          <span>📄</span>
          <span>{file.path}</span>
        </div>
        <button className="file-viewer-close" onClick={onClose}>✕</button>
      </div>

      <div className="file-viewer-body">
        {/* Code Panel */}
        <div className="file-viewer-code">
          <div className="panel-label">Source Code</div>
          {isLoadingContent ? (
            <div className="skeleton-block">
              <div className="skeleton-line" style={{ width: '80%' }}></div>
              <div className="skeleton-line" style={{ width: '60%' }}></div>
              <div className="skeleton-line" style={{ width: '90%' }}></div>
              <div className="skeleton-line" style={{ width: '45%' }}></div>
              <div className="skeleton-line" style={{ width: '75%' }}></div>
            </div>
          ) : content ? (
            <pre className="code-block">
              <code>{content}</code>
            </pre>
          ) : (
            <p className="text-muted">Could not load file content.</p>
          )}
        </div>

        {/* Explanation Panel */}
        <div className="file-viewer-explanation">
          <div className="panel-label">🤖 AI Explanation</div>
          {isLoadingExplanation ? (
            <div className="skeleton-block">
              <div className="skeleton-line" style={{ width: '100%' }}></div>
              <div className="skeleton-line" style={{ width: '85%' }}></div>
              <div className="skeleton-line" style={{ width: '70%' }}></div>
              <div className="skeleton-line" style={{ width: '90%' }}></div>
            </div>
          ) : explanation ? (
            <div className="explanation-content">
              <div className="explanation-section">
                <h4>Purpose</h4>
                <p>{explanation.purpose}</p>
              </div>

              {explanation.keyFunctions && explanation.keyFunctions.length > 0 && (
                <div className="explanation-section">
                  <h4>Key Functions</h4>
                  <ul>
                    {explanation.keyFunctions.map((fn, i) => (
                      <li key={i}>{fn}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="explanation-section">
                <h4>Connections</h4>
                <p>{explanation.connections}</p>
              </div>

              {explanation.complexity && (
                <div className="explanation-section">
                  <h4>Complexity</h4>
                  <span className={`complexity-badge complexity-${explanation.complexity}`}>
                    {explanation.complexity}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">Click a supported file to see its AI explanation.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
