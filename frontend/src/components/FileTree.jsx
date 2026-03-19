import React, { useState } from 'react';

const FileTreeNode = ({ node }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'tree';

  return (
    <div className="tree-node">
      <div className="tree-node-item" onClick={() => isFolder && setIsOpen(!isOpen)}>
        <span className={isFolder ? 'icon-folder' : 'icon-file'}>
          {isFolder ? (isOpen ? '📂' : '📁') : '📄'}
        </span>
        <span>{node.name}</span>
      </div>
      
      {isFolder && isOpen && node.children && (
        <div style={{ marginLeft: '0.5rem' }}>
          {node.children.map((child, idx) => (
            <FileTreeNode key={idx} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ data }) => {
  // Convert flat github tree to nested structure
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
    
    // Sort logic: Folders first, then files
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
           {data.owner} / <span style={{ color: 'var(--accent)' }}>{data.repo}</span>
           <span className="repo-branch">{data.defaultBranch}</span>
        </h2>
      </div>
      <div className="tree-root">
        {nestedTree.map((node, idx) => (
          <FileTreeNode key={idx} node={node} />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
