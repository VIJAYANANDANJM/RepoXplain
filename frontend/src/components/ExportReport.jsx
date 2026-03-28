import React from 'react';

const ExportReport = ({ repoData, summary, complexity }) => {
  if (!repoData) return null;

  const generateMarkdown = () => {
    let md = `# 📊 RepoXplain Analysis Report\n`;
    md += `## ${repoData.owner}/${repoData.repo}\n`;
    md += `**Branch:** ${repoData.defaultBranch}\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n\n`;

    if (summary) {
      md += `---\n## 🧠 Project Intelligence\n\n`;
      if (summary.techStack && summary.techStack.length > 0) {
        md += `### Tech Stack\n`;
        summary.techStack.forEach(t => { md += `- ${t.icon} ${t.name}\n`; });
        md += `\n`;
      }
      if (summary.overview) md += `### Overview\n${typeof summary.overview === 'string' ? summary.overview : JSON.stringify(summary.overview, null, 2)}\n\n`;
      if (summary.architecture) md += `### Architecture\n${typeof summary.architecture === 'string' ? summary.architecture : JSON.stringify(summary.architecture, null, 2)}\n\n`;
      if (summary.howToRun) md += `### How to Run\n${typeof summary.howToRun === 'string' ? summary.howToRun : JSON.stringify(summary.howToRun, null, 2)}\n\n`;
      if (summary.highlights && summary.highlights.length > 0) {
        md += `### Highlights\n`;
        summary.highlights.forEach(h => { md += `- ${typeof h === 'string' ? h : JSON.stringify(h)}\n`; });
        md += `\n`;
      }
    }

    if (complexity) {
      md += `---\n## 📊 Codebase Statistics\n\n`;
      md += `| Metric | Value |\n|---|---|\n`;
      md += `| Files | ${complexity.totalFiles} |\n`;
      md += `| Folders | ${complexity.folders} |\n`;
      md += `| Est. Lines | ${complexity.estimatedLines?.toLocaleString()} |\n`;
      md += `| Scale | ${complexity.score} |\n\n`;
      if (complexity.languages && complexity.languages.length > 0) {
        md += `### Language Breakdown\n`;
        complexity.languages.forEach(l => { md += `- \`${l.extension}\` — ${l.count} files (${l.percentage}%)\n`; });
        md += `\n`;
      }
    }

    md += `---\n## 📁 File Tree\n\n`;
    const blobs = repoData.tree.filter(f => f.type === 'blob').map(f => f.path);
    blobs.forEach(p => { md += `- ${p}\n`; });

    return md;
  };

  const handleExport = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoData.repo}-analysis.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="export-btn" onClick={handleExport} title="Download analysis report as Markdown">
      📥 Export Report
    </button>
  );
};

export default ExportReport;
