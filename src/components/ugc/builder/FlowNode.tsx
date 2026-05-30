'use client';

import React, { useCallback, useRef } from 'react';
import type { BuilderNode, BuilderNodeType } from '@/types/builder';

// ── Constants ──
const NODE_WIDTH = 140;
const NODE_HEIGHT = 64;
const DRAG_DELAY = 200;
const DRAG_THRESHOLD = 4;
const GRID_SNAP = 20;
const HANDLE_RADIUS = 6;
const HANDLE_OFFSET = 15;

// ── Type config (mirrors NODE_TYPE_CONFIG in QuestBuilderPanel) ──

interface NodeTypeVisual {
  icon: string;
  label: string;
  bgColor: string;
  borderColor: string;
}

const NODE_VISUALS: Record<BuilderNodeType, NodeTypeVisual> = {
  text:     { icon: '📝', label: 'テキスト', bgColor: '#2a1f14', borderColor: '#b45309' },
  battle:   { icon: '⚔️', label: 'バトル',   bgColor: '#2a1414', borderColor: '#b91c1c' },
  delivery: { icon: '📦', label: '納品',     bgColor: '#142a1a', borderColor: '#047857' },
  trap:     { icon: '⚠️', label: 'トラップ', bgColor: '#2a2514', borderColor: '#a16207' },
  success:  { icon: '🏁', label: '成功',     bgColor: '#14201a', borderColor: '#16a34a' },
  failure:  { icon: '💀', label: '失敗',     bgColor: '#2a1818', borderColor: '#dc2626' },
};

// ── Helpers ──

function getNodePreview(node: BuilderNode): string {
  switch (node.type) {
    case 'text':
      return node.data.text || '（テキスト未入力）';
    case 'battle':
      return node.data.preset_enemy_id || '（敵未選択）';
    case 'delivery':
      return node.data.delivery_item_slug || '（アイテム未選択）';
    case 'trap':
      return `ダメージ ${node.data.damage_pct ?? 0}%`;
    case 'success':
      return 'クエスト成功';
    case 'failure':
      return 'クエスト失敗';
    default:
      return '';
  }
}

function getHandleCount(nodeType: BuilderNodeType): number {
  return nodeType === 'text' ? 2 : 1;
}

// ── Props ──

interface FlowNodeProps {
  node: BuilderNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onDragStart: (nodeId: string) => void;
  onDragMove: (nodeId: string, x: number, y: number) => void;
  onDragEnd: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onConnectStart: (nodeId: string, handleIndex: number) => void;
  outgoingEdgeCount: number;
}

// ── Component ──

function FlowNodeInner({
  node,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDelete,
  onConnectStart,
}: FlowNodeProps) {
  const visual = NODE_VISUALS[node.type];
  const handleCount = getHandleCount(node.type);
  const preview = getNodePreview(node);

  // Drag state refs
  const dragStateRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startNodeX: number;
    startNodeY: number;
    pointerId: number;
    delayTimer: ReturnType<typeof setTimeout> | null;
    hasMoved: boolean;
  } | null>(null);

  const svgGroupRef = useRef<SVGGElement>(null);

  // Resolve viewport transform from parent SVG
  const getViewportTransform = useCallback((): { x: number; y: number; zoom: number } => {
    const svgEl = svgGroupRef.current?.closest('svg');
    if (!svgEl) return { x: 0, y: 0, zoom: 1 };
    const gEl = svgEl.querySelector('[data-viewport-group]') as SVGGElement | null;
    if (!gEl) return { x: 0, y: 0, zoom: 1 };
    const transform = gEl.getAttribute('transform') || '';
    const translateMatch = transform.match(/translate\(([-\d.]+)[, ]([-\d.]+)\)/);
    const scaleMatch = transform.match(/scale\(([-\d.]+)\)/);
    return {
      x: translateMatch ? parseFloat(translateMatch[1]) : 0,
      y: translateMatch ? parseFloat(translateMatch[2]) : 0,
      zoom: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
    };
  }, []);

  // ── Node drag handlers ──

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore right-click
      if (e.button !== 0) return;
      e.stopPropagation();

      const pointerId = e.pointerId;

      // Start delay timer for drag
      const state = {
        isDragging: false,
        startX: e.clientX,
        startY: e.clientY,
        startNodeX: node.position.x,
        startNodeY: node.position.y,
        pointerId,
        delayTimer: null as ReturnType<typeof setTimeout> | null,
        hasMoved: false,
      };

      state.delayTimer = setTimeout(() => {
        state.isDragging = true;
        onDragStart(node.id);
      }, DRAG_DELAY);

      dragStateRef.current = state;

      // Capture pointer on the SVG root to get move events outside the node
      const svgEl = svgGroupRef.current?.closest('svg');
      if (svgEl) {
        (svgEl as Element).setPointerCapture(pointerId);
      }
    },
    [node.id, node.position.x, node.position.y, onDragStart],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== e.pointerId) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > DRAG_THRESHOLD) {
        state.hasMoved = true;
        // If we moved before delay, start drag immediately
        if (!state.isDragging && state.delayTimer) {
          clearTimeout(state.delayTimer);
          state.delayTimer = null;
          state.isDragging = true;
          onDragStart(node.id);
        }
      }

      if (state.isDragging) {
        const vp = getViewportTransform();
        const newX = state.startNodeX + dx / vp.zoom;
        const newY = state.startNodeY + dy / vp.zoom;
        onDragMove(node.id, newX, newY);
      }
    },
    [node.id, onDragStart, onDragMove, getViewportTransform],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== e.pointerId) return;

      if (state.delayTimer) {
        clearTimeout(state.delayTimer);
      }

      const svgEl = svgGroupRef.current?.closest('svg');
      if (svgEl) {
        (svgEl as Element).releasePointerCapture(state.pointerId);
      }

      if (state.isDragging) {
        // Snap to grid
        const vp = getViewportTransform();
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const rawX = state.startNodeX + dx / vp.zoom;
        const rawY = state.startNodeY + dy / vp.zoom;
        const snappedX = Math.round(rawX / GRID_SNAP) * GRID_SNAP;
        const snappedY = Math.round(rawY / GRID_SNAP) * GRID_SNAP;
        onDragMove(node.id, snappedX, snappedY);
        onDragEnd(node.id);
      } else if (!state.hasMoved) {
        // Short click → select
        onSelect(node.id);
      }

      dragStateRef.current = null;
    },
    [node.id, onSelect, onDragMove, onDragEnd, getViewportTransform],
  );

  // ── Handle (connection port) press ──

  const handleConnectDown = useCallback(
    (e: React.PointerEvent, handleIndex: number) => {
      e.stopPropagation();
      e.preventDefault();
      onConnectStart(node.id, handleIndex);
    },
    [node.id, onConnectStart],
  );

  // ── Delete press ──

  const handleDeleteDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDelete(node.id);
    },
    [node.id, onDelete],
  );

  // Selected ring style
  const selectedRing = isSelected
    ? '0 0 0 2px #fbbf24, 0 4px 12px rgba(251,191,36,0.2)'
    : 'none';

  return (
    <g ref={svgGroupRef}>
      {/* Node card via foreignObject */}
      <foreignObject
        x={node.position.x}
        y={node.position.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ overflow: 'visible' }}
      >
        <div
          style={{
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            backgroundColor: visual.bgColor,
            border: `1px solid ${visual.borderColor}`,
            borderRadius: 8,
            padding: '6px 8px',
            boxSizing: 'border-box',
            cursor: 'grab',
            userSelect: 'none',
            boxShadow: selectedRing,
            transition: 'box-shadow 0.15s',
            position: 'relative',
            touchAction: 'none',
          }}
        >
          {/* Delete button */}
          <div
            onPointerDown={handleDeleteDown}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              backgroundColor: '#7f1d1d',
              border: '1px solid #dc2626',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 10,
              color: '#fca5a5',
              lineHeight: 1,
              zIndex: 10,
              touchAction: 'none',
            }}
          >
            ✕
          </div>

          {/* Type header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>{visual.icon}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#a38b6b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {visual.label}
            </span>
          </div>

          {/* Preview text */}
          <div
            style={{
              fontSize: 10,
              color: 'rgba(227,213,184,0.7)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {preview}
          </div>
        </div>
      </foreignObject>

      {/* Connection handles at the bottom */}
      {handleCount === 1 && (
        <circle
          cx={node.position.x + NODE_WIDTH / 2}
          cy={node.position.y + NODE_HEIGHT + HANDLE_RADIUS + 2}
          r={HANDLE_RADIUS}
          fill="#fbbf24"
          stroke="#5c3c2a"
          strokeWidth={1.5}
          style={{ cursor: 'pointer' }}
          onPointerDown={(e) => handleConnectDown(e, 0)}
        />
      )}
      {handleCount === 2 && (
        <>
          {/* Left handle (choice A / handle 0) */}
          <circle
            cx={node.position.x + NODE_WIDTH / 2 - HANDLE_OFFSET}
            cy={node.position.y + NODE_HEIGHT + HANDLE_RADIUS + 2}
            r={HANDLE_RADIUS}
            fill="#fbbf24"
            stroke="#5c3c2a"
            strokeWidth={1.5}
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => handleConnectDown(e, 0)}
          />
          {/* Right handle (choice B / handle 1) */}
          <circle
            cx={node.position.x + NODE_WIDTH / 2 + HANDLE_OFFSET}
            cy={node.position.y + NODE_HEIGHT + HANDLE_RADIUS + 2}
            r={HANDLE_RADIUS}
            fill="#fbbf24"
            stroke="#5c3c2a"
            strokeWidth={1.5}
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => handleConnectDown(e, 1)}
          />
        </>
      )}
    </g>
  );
}

const FlowNode = React.memo(FlowNodeInner);
export default FlowNode;
