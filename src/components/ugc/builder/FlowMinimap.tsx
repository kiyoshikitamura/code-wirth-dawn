'use client';

import React, { useCallback, useMemo } from 'react';
import type { BuilderEdge, BuilderNode, BuilderNodeType } from '@/types/builder';

// ── Constants ──
const MAP_WIDTH = 120;
const MAP_HEIGHT = 80;
const NODE_DOT_W = 4;
const NODE_DOT_H = 3;

// Node type → dot color
const DOT_COLORS: Record<BuilderNodeType, string> = {
  text: '#b45309',
  battle: '#b91c1c',
  delivery: '#047857',
  trap: '#a16207',
  success: '#16a34a',
  failure: '#dc2626',
};

// ── Props ──

interface FlowMinimapProps {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  viewport: { x: number; y: number; zoom: number };
  canvasSize: { width: number; height: number };
  onViewportJump: (x: number, y: number) => void;
}

// ── Component ──

function FlowMinimapInner({
  nodes,
  edges,
  viewport,
  canvasSize,
  onViewportJump,
}: FlowMinimapProps) {
  // Calculate bounds of all nodes
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of nodes) {
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.x + 140 > maxX) maxX = n.position.x + 140;
      if (n.position.y + 64 > maxY) maxY = n.position.y + 64;
    }
    // Add padding
    const padX = (maxX - minX) * 0.2 + 40;
    const padY = (maxY - minY) * 0.2 + 40;
    return { minX: minX - padX, minY: minY - padY, maxX: maxX + padX, maxY: maxY + padY };
  }, [nodes]);

  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scaleX = MAP_WIDTH / worldW;
  const scaleY = MAP_HEIGHT / worldH;
  const scale = Math.min(scaleX, scaleY);

  // Map a world coordinate to minimap coordinate
  const toMap = useCallback(
    (wx: number, wy: number): { x: number; y: number } => ({
      x: (wx - bounds.minX) * scale,
      y: (wy - bounds.minY) * scale,
    }),
    [bounds.minX, bounds.minY, scale],
  );

  // Viewport rectangle in world coords
  const vpWorldX = -viewport.x / viewport.zoom;
  const vpWorldY = -viewport.y / viewport.zoom;
  const vpWorldW = canvasSize.width / viewport.zoom;
  const vpWorldH = canvasSize.height / viewport.zoom;

  const vpMap = toMap(vpWorldX, vpWorldY);
  const vpMapW = vpWorldW * scale;
  const vpMapH = vpWorldH * scale;

  // Handle click → jump viewport
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // Convert minimap click to world coord
      const worldX = mx / scale + bounds.minX;
      const worldY = my / scale + bounds.minY;
      onViewportJump(worldX, worldY);
    },
    [scale, bounds.minX, bounds.minY, onViewportJump],
  );

  // Build node lookup for edges
  const nodeMap = useMemo(() => {
    const m = new Map<string, BuilderNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  return (
    <div
      className="absolute right-3 bottom-20 z-30"
      style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
    >
      <svg
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        onClick={handleClick}
        style={{
          backgroundColor: 'rgba(26,18,14,0.9)',
          border: '1px solid #5c3c2a',
          borderRadius: 8,
          cursor: 'pointer',
          display: 'block',
        }}
      >
        {/* Edges as thin lines */}
        {edges.map((edge) => {
          const src = nodeMap.get(edge.source);
          const tgt = nodeMap.get(edge.target);
          if (!src || !tgt) return null;
          const s = toMap(src.position.x + 70, src.position.y + 64);
          const t = toMap(tgt.position.x + 70, tgt.position.y);
          return (
            <line
              key={edge.id}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke="#a38b6b"
              strokeWidth={0.5}
              strokeOpacity={0.5}
            />
          );
        })}

        {/* Nodes as colored dots */}
        {nodes.map((node) => {
          const pos = toMap(node.position.x, node.position.y);
          return (
            <rect
              key={node.id}
              x={pos.x}
              y={pos.y}
              width={NODE_DOT_W}
              height={NODE_DOT_H}
              fill={DOT_COLORS[node.type]}
              rx={1}
            />
          );
        })}

        {/* Viewport rectangle */}
        <rect
          x={vpMap.x}
          y={vpMap.y}
          width={Math.max(vpMapW, 4)}
          height={Math.max(vpMapH, 3)}
          fill="rgba(251,191,36,0.12)"
          stroke="#fbbf24"
          strokeWidth={1}
          strokeOpacity={0.6}
          rx={1}
        />
      </svg>
    </div>
  );
}

const FlowMinimap = React.memo(FlowMinimapInner);
export default FlowMinimap;
