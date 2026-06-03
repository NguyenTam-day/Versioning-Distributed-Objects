import React, { useEffect, useRef, useState } from 'react';

/**
 * VersionDAG - Directed Acyclic Graph visualizer for version history
 * 
 * Props:
 *   versions: Array - Version history with parentVersion or parentVersionId
 *   branches: Object - Branch information {name: branchVersionName}
 *   currentVersionId: String - Currently selected version name (baseVersion)
 *   onVersionSelect: Function - Callback when version is clicked
 */
const VersionDAG = ({ 
  versions = [], 
  branches = {}, 
  currentVersionId = null,
  onVersionSelect = () => {},
  width = '100%',
  height = '350px'
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(currentVersionId);

  useEffect(() => {
    setSelectedNodeId(currentVersionId);
  }, [currentVersionId]);

  useEffect(() => {
    if (!versions.length) return;

    // Build DAG structure
    const dagNodes = buildDAGNodes();
    const dagEdges = buildDAGEdges();

    setNodes(dagNodes);
    setEdges(dagEdges);
  }, [versions, branches, currentVersionId]);

  useEffect(() => {
    if (nodes.length && canvasRef.current) {
      drawDAG();
    }
  }, [nodes, edges, selectedNodeId]);

  const buildDAGNodes = () => {
    const nodeMap = new Map();

    versions.forEach(version => {
      const id = version.versionName || version.id || version._id;
      nodeMap.set(id, {
        id: id,
        label: version.versionName || `v${version.versionNumber}`,
        version: version,
        branch: version.branchName || version.branch || 'main',
        timestamp: version.timestamp
      });
    });

    return Array.from(nodeMap.values());
  };

  const buildDAGEdges = () => {
    return versions
      .filter(v => v.parentVersion || v.parentVersionId)
      .map(v => ({
        source: v.parentVersion || v.parentVersionId,
        target: v.versionName || v.id || v._id,
        type: (v.conflicted || v.hasConflict) ? 'conflict' : 'normal'
      }));
  };

  const calculateNodePositions = () => {
    if (!nodes.length) return new Map();

    const positionMap = new Map();
    
    // Group by version number (x-axis)
    const levels = new Map();
    nodes.forEach(node => {
      const level = node.version.versionNumber || 0;
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level).push(node);
    });

    const canvas = canvasRef.current;
    if (!canvas) return positionMap;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const levelWidth = canvasWidth / (levels.size || 1);
    const nodeRadius = 24;

    let levelIndex = 0;
    for (const [level, levelNodes] of levels) {
      const nodeHeight = canvasHeight / (levelNodes.length + 1);

      levelNodes.forEach((node, nodeIndex) => {
        positionMap.set(node.id, {
          x: levelIndex * levelWidth + levelWidth / 2,
          y: (nodeIndex + 1) * nodeHeight
        });
      });

      levelIndex++;
    }

    return positionMap;
  };

  const drawDAG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas with GitHub-inspired dark background
    ctx.fillStyle = '#0d1117'; // --color-canvas-default
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const positions = calculateNodePositions();
    const nodeRadius = 24;

    // Draw edges first
    edges.forEach(edge => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);

      if (source && target) {
        if (edge.type === 'conflict') {
          ctx.strokeStyle = '#f85149'; // --color-danger-fg
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#30363d'; // --color-border-default
          ctx.lineWidth = 2;
        }

        // Draw bezier curve for smooth git branching/merging look
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        
        const cp1x = source.x + (target.x - source.x) * 0.5;
        const cp1y = source.y;
        const cp2x = source.x + (target.x - source.x) * 0.5;
        const cp2y = target.y;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);
        ctx.stroke();

        // Draw directional arrow near target
        const angle = Math.atan2(target.y - cp2y, target.x - cp2x);
        const arrowSize = 8;
        ctx.fillStyle = edge.type === 'conflict' ? '#f85149' : '#8b949e';

        ctx.beginPath();
        // Shift arrow slightly back from node circumference
        const arrowX = target.x - nodeRadius * Math.cos(angle);
        const arrowY = target.y - nodeRadius * Math.sin(angle);
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - arrowSize * Math.cos(angle - Math.PI / 6), 
                   arrowY - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(arrowX - arrowSize * Math.cos(angle + Math.PI / 6), 
                   arrowY - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const isSelected = selectedNodeId === node.id;
      const isConflicted = node.version.conflicted || node.version.hasConflict;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);

      if (isSelected) {
        ctx.fillStyle = '#238636'; // --color-success-emphasis
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3fb950'; // --color-success-fg
      } else if (isConflicted) {
        ctx.fillStyle = '#da3633'; // --color-danger-emphasis
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f85149'; // --color-danger-fg
      } else {
        // Normal node
        ctx.fillStyle = '#21262d'; // --color-btn-bg
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#30363d'; // --color-border-default
      }

      ctx.fill();
      ctx.stroke();

      // Draw version label inside node
      ctx.fillStyle = isSelected ? '#ffffff' : '#e6edf3';
      ctx.font = 'bold 10px ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, pos.x, pos.y - 4);

      // Draw branch label below node
      ctx.font = '9px ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace';
      ctx.fillStyle = isSelected ? '#3fb950' : (isConflicted ? '#f85149' : '#8b949e');
      ctx.fillText(node.branch, pos.x, pos.y + 8);
    });

    // Draw Legend
    drawLegend(ctx);
  };

  const drawLegend = (ctx) => {
    const legendX = 15;
    const legendY = 15;
    const itemHeight = 22;

    ctx.font = '11px ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const items = [
      { color: '#238636', stroke: '#3fb950', label: 'Selected Base' },
      { color: '#da3633', stroke: '#f85149', label: 'Conflict Version' },
      { color: '#21262d', stroke: '#30363d', label: 'Normal Version' }
    ];

    items.forEach((item, index) => {
      const y = legendY + index * itemHeight;

      // Draw color circle indicator
      ctx.beginPath();
      ctx.arc(legendX + 6, y + 6, 6, 0, 2 * Math.PI);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = item.stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#8b949e'; // --color-text-secondary
      ctx.fillText(item.label, legendX + 20, y + 6);
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nodeRadius = 24;

    const positions = calculateNodePositions();

    for (const node of nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const distance = Math.sqrt(
        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
      );

      if (distance <= nodeRadius) {
        setSelectedNodeId(node.id);
        onVersionSelect(node);
        break;
      }
    }
  };

  const resetSelection = () => {
    setSelectedNodeId(currentVersionId);
  };

  // Adjust canvas resolution dynamically on container mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const resizeCanvas = () => {
      const rect = containerRef.current.parentElement.getBoundingClientRect();
      canvas.width = rect.width || 800;
      canvas.height = parseInt(height, 10) || 350;
      if (nodes.length) {
        drawDAG();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [nodes]);

  return (
    <div style={{ width, height, position: 'relative', border: '1px solid #30363d', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'pointer'
        }}
      />

      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        zIndex: 10
      }}>
        <button
          onClick={resetSelection}
          className="btn btn-secondary"
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            background: 'var(--color-btn-bg)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-default)'
          }}
        >
          Reset
        </button>
      </div>

      <div ref={containerRef} style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1 }} />
    </div>
  );
};

export default VersionDAG;
