import React, { useState } from 'react';
import HeroSearch from './components/HeroSearch';
import FileTree from './components/FileTree';
import FileViewer from './components/FileViewer';
import ProjectSummary from './components/ProjectSummary';
import SearchBar from './components/SearchBar';
import ComplexityScore from './components/ComplexityScore';
import DependencyGraph from './components/DependencyGraph';

const API_BASE = '/api';

function App() {
  // Phase 1 state
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState(null);
  const [error, setError] = useState('');

  // Phase 2 state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Phase 3 state
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Phase 4 state
  const [searchTerm, setSearchTerm] = useState('');
  const [complexity, setComplexity] = useState(null);
  const [loadingComplexity, setLoadingComplexity] = useState(false);
  const [depEdges, setDepEdges] = useState(null);
  const [loadingDeps, setLoadingDeps] = useState(false);

  // ─── Phase 1: Analyze ────────────────────────────────────
  const handleAnalyze = async (url) => {
    setLoading(true);
    setError('');
    setRepoData(null);
    setSummary(null);
    setComplexity(null);
    setDepEdges(null);
    setSelectedFile(null);
    setFileContent(null);
    setExplanation(null);
    setSearchTerm('');

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch repository data');
      setRepoData(data);

      // Auto-trigger Phase 3 & 4 in parallel
      fetchSummary(data);
      fetchComplexity(data);
      fetchDependencies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Phase 2: File Content + Explain ─────────────────────
  const handleFileSelect = async (node) => {
    setSelectedFile(node);
    setFileContent(null);
    setExplanation(null);
    setLoadingContent(true);

    try {
      const res = await fetch(`${API_BASE}/file-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repoData.owner,
          repo: repoData.repo,
          path: node.path,
          branch: repoData.defaultBranch,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFileContent(data.content);
      setLoadingContent(false);

      // Auto-trigger AI Explanation
      setLoadingExplanation(true);
      try {
        const explainRes = await fetch(`${API_BASE}/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.content, fileName: node.name }),
        });
        const explainData = await explainRes.json();
        if (explainRes.ok) setExplanation(explainData);
      } catch {
        // Explanation is optional, don't block
      } finally {
        setLoadingExplanation(false);
      }
    } catch {
      setFileContent(null);
      setLoadingContent(false);
    }
  };

  // ─── Phase 3: Summarize ──────────────────────────────────
  const fetchSummary = async (data) => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: data.owner,
          repo: data.repo,
          tree: data.tree,
          description: data.description,
          language: data.language,
        }),
      });
      const result = await res.json();
      if (res.ok) setSummary(result);
    } catch {
      // Summary is optional
    } finally {
      setLoadingSummary(false);
    }
  };

  // ─── Phase 4: Complexity ─────────────────────────────────
  const fetchComplexity = async (data) => {
    setLoadingComplexity(true);
    try {
      const res = await fetch(`${API_BASE}/complexity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tree: data.tree }),
      });
      const result = await res.json();
      if (res.ok) setComplexity(result);
    } catch {
      // Optional
    } finally {
      setLoadingComplexity(false);
    }
  };

  // ─── Phase 4: Dependencies ───────────────────────────────
  const fetchDependencies = async (data) => {
    setLoadingDeps(true);
    try {
      const res = await fetch(`${API_BASE}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: data.owner,
          repo: data.repo,
          branch: data.defaultBranch,
          tree: data.tree,
        }),
      });
      const result = await res.json();
      if (res.ok) setDepEdges(result.edges);
    } catch {
      // Optional
    } finally {
      setLoadingDeps(false);
    }
  };

  return (
    <div className="app-container">
      <HeroSearch onAnalyze={handleAnalyze} isLoading={loading} />

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {/* Phase 3: Project Summary */}
      <ProjectSummary summary={summary} isLoading={loadingSummary} />

      {/* Phase 4: Stats + Deps Row */}
      {(complexity || loadingComplexity || depEdges || loadingDeps) && (
        <div className="insights-row">
          <ComplexityScore stats={complexity} isLoading={loadingComplexity} />
          <DependencyGraph edges={depEdges} isLoading={loadingDeps} />
        </div>
      )}

      {/* Phase 4: Search + Phase 1: Tree */}
      {repoData && (
        <>
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <FileTree data={repoData} onFileSelect={handleFileSelect} searchTerm={searchTerm} />
        </>
      )}

      {/* Phase 2: File Viewer */}
      <FileViewer
        file={selectedFile}
        content={fileContent}
        explanation={explanation}
        isLoadingContent={loadingContent}
        isLoadingExplanation={loadingExplanation}
        onClose={() => {
          setSelectedFile(null);
          setFileContent(null);
          setExplanation(null);
        }}
      />
    </div>
  );
}

export default App;
