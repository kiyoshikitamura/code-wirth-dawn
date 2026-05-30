'use client';

import React, { useCallback } from 'react';
import type { BuilderEdge, BuilderNode } from '@/types/builder';

// ── Constants ──
const NODE_WIDTH = 140;
const NODE_HEIGHT = 64;
const BEZIER_OFFSET = 50;
const HANDLE_OFFSET = 15;

// ── Props ──

interface FlowEdgeProps {
  edge: BuilderEdge;
  sourceNode: BuilderNode;
  targetNode: BuilderNode;
  isSelected: boolean;
  onSelect: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
}

// ── Component ──

function FlowEdgeInner({
  edge,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
  onDelete,
}: FlowEdgeProps) {
  // Source point: bottom center of source node, offset for handle index
  let sx = sourceNode.position.x + NODE_WIDTH / 2;
  const sy = sourceNode.position.y + NODE_HEIGHT;

  if (edge.handleIndex === 0) {
    sx -= HANDLE_OFFSET;
  } else if (edge.handleIndex === 1) {
    sx += HANDLE_OFFSET;
  }

  // Target point: top center of target node
  const tx = targetNode.position.x + NODE_WIDTH / 2;
  const ty = targetNode.position.y;

  // Bezier path
  const pathD = `M ${sx},${sy} C ${sx},${sy + BEZIER_OFFSET} ${tx},${ty - BEZIER_OFFSET} ${tx},${ty}`;

  // Midpoint for label & delete button
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;

  const handleClick = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(edge.id);
    },
    [edge.id, onSelect],
  );

  const handleDelete = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onDelete(edge.id);
    },
    [edge.id, onDelete],
  );

  return (
    <g>
      {/* Invisible hit area for touch friendliness */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        onPointerDown={handleClick}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible path */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#fbbf24' : '#a38b6b'}
        strokeWidth={isSelected ? 3 : 2}
        strokeOpacity={isSelected ? 1 : 0.6}
        onPointerDown={handleClick}
        style={{ cursor: 'pointer', transition: 'stroke 0.15s, stroke-width 0.15s' }}
      />

      {/* Arrow head at target */}
      <polygon
        points={`${tx},${ty} ${tx - 4},${ty - 8} ${tx + 4},${ty - 8}`}
        fill={isSelected ? '#fbbf24' : '#a38b6b'}
        fillOpacity={isSelected ? 1 : 0.6}
      />

      {/* Label */}
      {edge.label && (
        <text
          x={mx}
          y={my - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e3d5b8"
          fontSize={10}
          fontWeight="bold"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {edge.label}
        </text>
      )}

      {/* Delete button - shown when selected */}
      {isSelected && (
        <g
          onPointerDown={handleDelete}
          style={{ cursor: 'pointer' }}
        >
          <circle cx={mx} cy={my} r={10} fill="#1a120e" stroke="#b91c1c" strokeWidth={1.5} />
          <text
            x={mx}
            y={my}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fca5a5"
            fontSize={11}
            fontWeight="bold"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            ✕
          </text>
        </g>
      )}
    </g>
  );
}

const FlowEdge = React.memo(FlowEdgeInner);
export default FlowEdge;
