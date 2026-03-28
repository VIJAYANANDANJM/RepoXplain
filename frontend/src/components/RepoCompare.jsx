import React, { useState } from 'react';

const API_BASE = '/api';

const RepoCompare = () => {
  const [repoA, setRepoA] = useState('');
  const [repoB, setRepoB] = useState('');
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeRepo = async (url) => {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl: url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Fetch complexity
    const cRes = await fetch(`${API_BASE}/complexity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tree: data.tree }),
    });
    const complexity = await cRes.json();

    // Detect tech stack
    const fileNames = data.tree.map(f => f.path.split('/').pop().toLowerCase());
    const techs = [];
    const checks = [
      { files: ['package.json'], name: 'Node.js' }, { files: ['requirements.txt', 'setup.py'], name: 'Python' },
      { files: ['pom.xml', 'build.gradle'], name: 'Java' }, { files: ['go.mod'], name: 'Go' },
      { files: ['cargo.toml'], name: 'Rust' }, { files: ['dockerfile'], name: 'Docker' },
      { files: ['tsconfig.json'], name: 'TypeScript' },
    ];
    const hasReact = data.tree.some(f => f.path.endsWith('.jsx') || f.path.endsWith('.tsx'));
    if (hasReact) techs.push('React');
    checks.forEach(c => { if (c.files.some(f => fileNames.includes(f))) techs.push(c.name); });

    return {
      name: `${data.owner}/${data.repo}`,
      owner: data.owner, repo: data.repo,
      description: data.description, language: data.language,
      branch: data.defaultBranch,
      ...complexity,
      techs: [...new Set(techs)],
    };
  };

  const handleCompare = async () => {
    if (!repoA.trim() || !repoB.trim()) return;
    setLoading(true); setError(''); setDataA(null); setDataB(null);
    try {
      const [a, b] = await Promise.all([analyzeRepo(repoA.trim()), analyzeRepo(repoB.trim())]);
      setDataA(a); setDataB(b);
    } catch (err) {
      setError(err.message || 'Failed to compare repositories.');
    } finally { setLoading(false); }
  };

  const CompareRow = ({ label, valA, valB, highlight }) => {
    const aWins = highlight && typeof valA === 'number' && typeof valB === 'number' && valA > valB;
    const bWins = highlight && typeof valA === 'number' && typeof valB === 'number' && valB > valA;
    return (
      <div className="compare-row">
        <span className={`compare-val${aWins ? ' compare-win' : ''}`}>{typeof valA === 'number' ? valA.toLocaleString() : valA}</span>
        <span className="compare-label">{label}</span>
        <span className={`compare-val${bWins ? ' compare-win' : ''}`}>{typeof valB === 'number' ? valB.toLocaleString() : valB}</span>
      </div>
    );
  };

  return (
    <div className="compare-container">
      <div className="compare-inputs">
        <input className="compare-input" value={repoA} onChange={e => setRepoA(e.target.value)}
          placeholder="First repo URL..." />
        <span className="compare-vs">VS</span>
        <input className="compare-input" value={repoB} onChange={e => setRepoB(e.target.value)}
          placeholder="Second repo URL..." />
        <button className="compare-btn" onClick={handleCompare} disabled={loading}>
          {loading ? <span className="loader"></span> : '⚡ Compare'}
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginTop: '0.8rem' }}>{error}</div>}

      {dataA && dataB && (
        <div className="compare-results">
          <div className="compare-header">
            <span className="compare-repo-name">{dataA.name}</span>
            <span className="compare-repo-name">{dataB.name}</span>
          </div>
          <CompareRow label="📁 Files" valA={dataA.totalFiles} valB={dataB.totalFiles} highlight />
          <CompareRow label="📂 Folders" valA={dataA.folders} valB={dataB.folders} highlight />
          <CompareRow label="📝 Est. Lines" valA={dataA.estimatedLines} valB={dataB.estimatedLines} highlight />
          <CompareRow label="💾 Size" valA={`${(dataA.totalSize / 1024).toFixed(0)} KB`} valB={`${(dataB.totalSize / 1024).toFixed(0)} KB`} />
          <CompareRow label="📊 Scale" valA={dataA.score} valB={dataB.score} />
          <CompareRow label="🔤 Language" valA={dataA.language || '—'} valB={dataB.language || '—'} />
          <CompareRow label="🔧 Tech Stack" valA={dataA.techs.join(', ') || '—'} valB={dataB.techs.join(', ') || '—'} />
          <CompareRow label="🌿 Branch" valA={dataA.branch} valB={dataB.branch} />
        </div>
      )}
    </div>
  );
};

export default RepoCompare;
