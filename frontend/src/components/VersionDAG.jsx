import React, { useEffect, useRef, useState } from 'react';

/**
 * VersionDAG - Directed Acyclic Graph visualizer for version history
 * 
 * Props:
 *   versions: Array - Version history with parentVersionId
 *   branches: Object - Branch information {name: branchVersionId}
 *   currentVersionId: String - Currently selected version
 *   onVersionSelect: Function - Callback when version is clicked
 */
const VersionDAG = ({ 
  versions = [], 
  branches = {}, 
  currentVersionId = null,
  onVersionSelect = () => {},
  width = '100%',
  height = '500px'
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(currentVersionId);

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
      nodeMap.set(version._id, {
        id: version._id,
        label: `v${version.versionNumber}`,
        version: version,
        branch: version.branch || 'main',
        timestamp: version.timestamp
      });
    });

    return Array.from(nodeMap.values());
  };

  const buildDAGEdges = () => {
    return versions
      .filter(v => v.parentVersionId)
      .map(v => ({
        source: v.parentVersionId,
        target: v._id,
        type: v.hasConflict ? 'conflict' : 'normal'
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
    const nodeRadius = 30;

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
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const positions = calculateNodePositions();
    const nodeRadius = 30;

    // Draw edges first
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;

    edges.forEach(edge => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);

      if (source && target) {
        if (edge.type === 'conflict') {
          ctx.strokeStyle = '#ff6b6b';
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 2;
        }

        // Draw bezier curve
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        
        const cp1x = source.x + (target.x - source.x) * 0.3;
        const cp1y = source.y;
        const cp2x = source.x + (target.x - source.x) * 0.7;
        const cp2y = target.y;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowSize = 10;
        ctx.fillStyle = edge.type === 'conflict' ? '#ff6b6b' : '#999';

        ctx.beginPath();
        ctx.moveTo(target.x, target.y);
        ctx.lineTo(target.x - arrowSize * Math.cos(angle - Math.PI / 6), 
                   target.y - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(target.x - arrowSize * Math.cos(angle + Math.PI / 6), 
                   target.y - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const isSelected = selectedNodeId === node.id;
      const isCurrent = currentVersionId === node.id;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);

      if (isSelected) {
        ctx.fillStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#2e7d32';
      } else if (isCurrent) {
        ctx.fillStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1565c0';
      } else if (node.version.hasConflict) {
        ctx.fillStyle = '#ff9800';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f57c00';
      } else {
        ctx.fillStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#999';
      }

      ctx.fill();
      ctx.stroke();

      // Draw version label
      ctx.fillStyle = isSelected || isCurrent ? '#fff' : '#333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, pos.x, pos.y - 5);

      // Draw branch label if not main
      if (node.branch && node.branch !== 'main') {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(node.branch, pos.x, pos.y + 10);
      }
    });

    // Draw legend
    drawLegend(ctx);
  };

  const drawLegend = (ctx) => {
    const legendX = 10;
    const legendY = 10;
    const itemHeight = 20;

    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';

    // Legend items
    const items = [
      { color: '#4CAF50', label: 'Selected' },
      { color: '#2196F3', label: 'Current' },
      { color: '#ff9800', label: 'Conflict' },
      { color: '#e0e0e0', label: 'Normal' }
    ];

    items.forEach((item, index) => {
      const y = legendY + index * itemHeight;

      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, y, 10, 10);

      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX, y, 10, 10);

      ctx.fillStyle = '#333';
      ctx.fillText(item.label, legendX + 20, y + 8);
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nodeRadius = 30;

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

  return (
    <div style={{ width, height, position: 'relative', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={containerRef.current?.offsetWidth || 800}
        height={containerRef.current?.offsetHeight || 500}
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
          style={{
            padding: '8px 12px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reset
        </button>
      </div>

      <div ref={containerRef} style={{ position: 'absolute', width: 0, height: 0 }} />
    </div>
  );
};

export default VersionDAG;
