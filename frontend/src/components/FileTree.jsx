import React, { useState } from 'react';

const FileTreeNode = ({ node, onFileSelect, searchTerm }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'tree';

  // Search filtering
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

  // Auto-expand folders if searching
  const shouldBeOpen = searchTerm ? true : isOpen;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else if (onFileSelect) {
      onFileSelect(node);
    }
  };

  return (
    <div className="tree-node">
      <div className="tree-node-item" onClick={handleClick}>
        <span className={isFolder ? 'icon-folder' : 'icon-file'}>
          {isFolder ? (shouldBeOpen ? '📂' : '📁') : '📄'}
        </span>
        <span>{node.name}</span>
      </div>

      {isFolder && shouldBeOpen && node.children && (
        <div style={{ marginLeft: '0.5rem' }}>
          {node.children.map((child, idx) => (
            <FileTreeNode key={idx} node={child} onFileSelect={onFileSelect} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ data, onFileSelect, searchTerm }) => {
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
          <FileTreeNode key={idx} node={node} onFileSelect={onFileSelect} searchTerm={searchTerm} />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
