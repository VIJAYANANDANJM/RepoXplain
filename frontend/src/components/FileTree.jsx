import React, { useState } from 'react';

const FILE_ICONS = {
  '.js': { icon: '⬡', color: '#f1e05a' }, '.jsx': { icon: '⚛', color: '#61dafb' },
  '.ts': { icon: '◇', color: '#3178c6' }, '.tsx': { icon: '⚛', color: '#3178c6' },
  '.py': { icon: '🐍', color: '#3572A5' }, '.java': { icon: '☕', color: '#b07219' },
  '.go': { icon: '🐹', color: '#00ADD8' }, '.rs': { icon: '🦀', color: '#dea584' },
  '.rb': { icon: '💎', color: '#701516' }, '.php': { icon: '🐘', color: '#4F5D95' },
  '.css': { icon: '🎨', color: '#563d7c' }, '.html': { icon: '🌐', color: '#e34c26' },
  '.json': { icon: '{}', color: '#8b949e' }, '.md': { icon: '📝', color: '#083fa1' },
  '.yml': { icon: '⚙', color: '#cb171e' }, '.yaml': { icon: '⚙', color: '#cb171e' },
  '.sh': { icon: '⌨', color: '#89e051' }, '.sql': { icon: '🗃', color: '#e38c00' },
  '.xml': { icon: '◻', color: '#0060ac' }, '.c': { icon: 'C', color: '#555555' },
  '.cpp': { icon: 'C+', color: '#f34b7d' }, '.h': { icon: 'H', color: '#555555' },
  '.toml': { icon: '⚙', color: '#9c4221' }, '.env': { icon: '🔒', color: '#ecd53f' },
  '.dockerfile': { icon: '🐳', color: '#384d54' }, '.groovy': { icon: '⭐', color: '#4298b8' },
};

const getIcon = (name, isFolder) => {
  if (isFolder) return null;
  const ext = name.lastIndexOf('.') !== -1 ? name.slice(name.lastIndexOf('.')).toLowerCase() : '';
  return FILE_ICONS[ext] || null;
};

const FileTreeNode = ({ node, onFileSelect, searchTerm, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'tree';
  const isSelected = !isFolder && selectedPath === node.path;

  const matchesSearch = !searchTerm ||
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (node.path && node.path.toLowerCase().includes(searchTerm.toLowerCase()));

  const hasMatchingChildren = (n) => {
    if (!n.children) return false;
    return n.children.some(child =>
      child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (child.path && child.path.toLowerCase().includes(searchTerm.toLowerCase())) ||
      hasMatchingChildren(child)
    );
  };

  if (searchTerm && !matchesSearch && !hasMatchingChildren(node)) return null;

  const shouldBeOpen = searchTerm ? true : isOpen;
  const fileIcon = getIcon(node.name, isFolder);

  const handleClick = () => {
    if (isFolder) setIsOpen(!isOpen);
    else if (onFileSelect) onFileSelect(node);
  };

  return (
    <div className="tree-node">
      <div className={`tree-node-item${isSelected ? ' tree-node-selected' : ''}`} onClick={handleClick}>
        {isFolder ? (
          <span className="icon-folder">{shouldBeOpen ? '📂' : '📁'}</span>
        ) : fileIcon ? (
          <span style={{ color: fileIcon.color, fontSize: '0.9rem', fontWeight: 700, minWidth: '1.2rem', textAlign: 'center' }}>
            {fileIcon.icon}
          </span>
        ) : (
          <span className="icon-file">📄</span>
        )}
        <span className="tree-node-name">{node.name}</span>
      </div>

      {isFolder && shouldBeOpen && node.children && (
        <div className="tree-node-children">
          {node.children.map((child, idx) => (
            <FileTreeNode key={idx} node={child} onFileSelect={onFileSelect} searchTerm={searchTerm} selectedPath={selectedPath} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ data, onFileSelect, searchTerm, selectedPath }) => {
  const buildTree = (paths) => {
    const root = { name: 'root', type: 'tree', children: [] };
    paths.forEach(item => {
      const parts = item.path.split('/');
      let current = root;
      parts.forEach((part, index) => {
        let existingPath = current.children?.find(c => c.name === part);
        if (!existingPath) {
          existingPath = {
            name: part,
            type: index === parts.length - 1 ? item.type : 'tree',
            path: item.path,
            size: item.size,
            ...(index !== parts.length - 1 ? { children: [] } : {})
          };
          if (!current.children) current.children = [];
          current.children.push(existingPath);
        }
        current = existingPath;
      });
    });
    const sortNodes = (node) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type === 'tree' && b.type !== 'tree') return -1;
          if (a.type !== 'tree' && b.type === 'tree') return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortNodes);
      }
    };
    sortNodes(root);
    return root.children;
  };

  const nestedTree = React.useMemo(() => buildTree(data.tree), [data.tree]);

  return (
    <div className="results-container">
      <div className="results-header">
        <h2 className="repo-title">
          📦 {data.owner} / <span style={{ color: 'var(--accent)' }}>{data.repo}</span>
          <span className="repo-branch">{data.defaultBranch}</span>
        </h2>
      </div>
      <div className="tree-root">
        {nestedTree.map((node, idx) => (
          <FileTreeNode key={idx} node={node} onFileSelect={onFileSelect} searchTerm={searchTerm} selectedPath={selectedPath} />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
