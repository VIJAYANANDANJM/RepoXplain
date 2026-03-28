import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSearch from './components/HeroSearch';
import FileTree from './components/FileTree';
import FileViewer from './components/FileViewer';
import ProjectSummary from './components/ProjectSummary';
import SearchBar from './components/SearchBar';
import ComplexityScore from './components/ComplexityScore';
import DependencyGraph from './components/DependencyGraph';
import ExportReport from './components/ExportReport';

const API_BASE = '/api';

function App() {
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  // Phase 2
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Phase 3
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Phase 4
  const [searchTerm, setSearchTerm] = useState('');
  const [complexity, setComplexity] = useState(null);
  const [loadingComplexity, setLoadingComplexity] = useState(false);
  const [depEdges, setDepEdges] = useState(null);
  const [loadingDeps, setLoadingDeps] = useState(false);

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
    setActiveTab('summary');

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch repository data');
      setRepoData(data);
      fetchSummary(data);
      fetchComplexity(data);
      fetchDependencies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      setLoadingExplanation(true);
      try {
        const explainRes = await fetch(`${API_BASE}/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.content, fileName: node.name }),
        });
        const explainData = await explainRes.json();
        if (explainRes.ok) setExplanation(explainData);
      } catch { /* optional */ } finally {
        setLoadingExplanation(false);
      }
    } catch {
      setFileContent(null);
      setLoadingContent(false);
    }
  };

  const fetchSummary = async (data) => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: data.owner, repo: data.repo, tree: data.tree,
          description: data.description, language: data.language,
        }),
      });
      const result = await res.json();
      if (res.ok) setSummary(result);
    } catch { /* optional */ } finally { setLoadingSummary(false); }
  };

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
    } catch { /* optional */ } finally { setLoadingComplexity(false); }
  };

  const fetchDependencies = async (data) => {
    setLoadingDeps(true);
    try {
      const res = await fetch(`${API_BASE}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: data.owner, repo: data.repo,
          branch: data.defaultBranch, tree: data.tree,
        }),
      });
      const result = await res.json();
      if (res.ok) setDepEdges(result.edges);
    } catch { /* optional */ } finally { setLoadingDeps(false); }
  };

  const tabs = [
    { id: 'summary', label: '🧠 Summary', icon: '' },
    { id: 'explorer', label: '📁 Explorer', icon: '' },
    { id: 'insights', label: '📊 Insights', icon: '' },
  ];

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="app-container">
        <HeroSearch onAnalyze={handleAnalyze} isLoading={loading} />

        {error && <div className="error-banner">{error}</div>}

        {repoData && (
          <>
            {/* Tab Bar */}
            <div className="tab-bar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn${activeTab === tab.id ? ' tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              <ExportReport repoData={repoData} summary={summary} complexity={complexity} />
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="tab-content">
                <ProjectSummary summary={summary} isLoading={loadingSummary} />
              </div>
            )}

            {/* Explorer Tab */}
            {activeTab === 'explorer' && (
              <div className="tab-content">
                <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <FileTree
                  data={repoData}
                  onFileSelect={handleFileSelect}
                  searchTerm={searchTerm}
                  selectedPath={selectedFile?.path}
                />
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
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="tab-content">
                <div className="insights-row">
                  <ComplexityScore stats={complexity} isLoading={loadingComplexity} />
                  <DependencyGraph edges={depEdges} isLoading={loadingDeps} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
