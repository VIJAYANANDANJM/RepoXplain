import React, { useRef, useEffect } from 'react';

const DependencyGraph = ({ edges, isLoading }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!edges || edges.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Collect unique nodes
    const nodeSet = new Set();
    edges.forEach(e => {
      nodeSet.add(e.source);
      nodeSet.add(e.target);
    });
    const nodes = Array.from(nodeSet).map((name, i) => {
      const shortName = name.split('/').pop();
      const angle = (2 * Math.PI * i) / nodeSet.size;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;
      return {
        id: name,
        label: shortName,
        x: canvas.width / (2 * dpr) + radius * Math.cos(angle),
        y: canvas.height / (2 * dpr) + radius * Math.sin(angle),
      };
    });

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Setup canvas
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Recalculate positions after resize
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const radius = Math.min(w, h) * 0.35;
      n.x = w / 2 + radius * Math.cos(angle);
      n.y = h / 2 + radius * Math.sin(angle);
    });

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw edges
    edges.forEach(e => {
      const sourceNode = nodeMap[e.source];
      // Try to resolve target relative path
      const targetKey = Object.keys(nodeMap).find(k => k.includes(e.target.replace('./', '')));
      const targetNode = targetKey ? nodeMap[targetKey] : null;
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#58a6ff';
      ctx.fill();
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#c9d1d9';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + 18);
    });

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

  if (!edges || edges.length === 0) return null;

  return (
    <div className="dep-graph-container">
      <h3>🔗 Dependency Graph</h3>
      <p className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
        Showing import/require relationships between source files
      </p>
      <canvas ref={canvasRef} className="dep-graph-canvas" />
    </div>
  );
};

export default DependencyGraph;
