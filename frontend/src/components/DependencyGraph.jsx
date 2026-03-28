import React, { useMemo } from 'react';

const DependencyGraph = ({ edges, isLoading }) => {
  const graphData = useMemo(() => {
    if (!edges || edges.length === 0) return null;

    // Collect unique nodes
    const nodeSet = new Set();
    edges.forEach(e => {
      nodeSet.add(e.source);
      // Normalize target — strip ./ and try to find the closest match
      const normalizedTarget = e.target.replace(/^\.\//, '').replace(/^\.\.\//, '');
      nodeSet.add(normalizedTarget);
    });

    const nodeArray = Array.from(nodeSet);
    const W = 700, H = 350;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.38;

    const nodes = nodeArray.map((id, i) => {
      const angle = (2 * Math.PI * i) / nodeArray.length - Math.PI / 2;
      return {
        id,
        label: id.split('/').pop().replace(/\.(js|jsx|ts|tsx|py|java)$/i, ''),
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Resolve edges with fuzzy matching
    const resolvedEdges = [];
    edges.forEach(e => {
      const source = nodeMap[e.source];
      const normalizedTarget = e.target.replace(/^\.\//, '').replace(/^\.\.\//, '');
      // Try exact match first, then partial match
      const target = nodeMap[normalizedTarget] ||
        nodes.find(n => n.id.endsWith(normalizedTarget) || n.id.includes(normalizedTarget.replace(/\.\w+$/, '')));
      if (source && target) {
        resolvedEdges.push({ source, target });
      }
    });

    return { nodes, edges: resolvedEdges, W, H };
  }, [edges]);

  if (isLoading) {
    return (
      <div className="dep-graph-container">
        <h3>🔗 Dependency Graph</h3>
        <div className="skeleton-block" style={{ height: '200px' }}>
          <div className="skeleton-line" style={{ width: '60%' }}></div>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.edges.length === 0) {
    return (
      <div className="dep-graph-container">
        <h3>🔗 Dependency Graph</h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>
          No local import relationships detected in this repository.
        </p>
      </div>
    );
  }

  return (
    <div className="dep-graph-container">
      <h3>🔗 Dependency Graph</h3>
      <p className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
        {graphData.edges.length} connections between {graphData.nodes.length} files
      </p>
      <div className="dep-graph-svg-wrapper">
        <svg
          viewBox={`0 0 ${graphData.W} ${graphData.H}`}
          className="dep-graph-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Edges */}
          {graphData.edges.map((e, i) => (
            <line
              key={`e-${i}`}
              x1={e.source.x} y1={e.source.y}
              x2={e.target.x} y2={e.target.y}
              stroke="rgba(88, 166, 255, 0.2)"
              strokeWidth="1.5"
            />
          ))}
          {/* Nodes */}
          {graphData.nodes.map((n, i) => (
            <g key={`n-${i}`}>
              <circle cx={n.x} cy={n.y} r="6" fill="#58a6ff" stroke="#0d1117" strokeWidth="2" className="dep-node" />
              <title>{n.id}</title>
              <text
                x={n.x} y={n.y + 18}
                textAnchor="middle"
                fill="#c9d1d9"
                fontSize="10"
                fontFamily="Inter, sans-serif"
                className="dep-label"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default DependencyGraph;
