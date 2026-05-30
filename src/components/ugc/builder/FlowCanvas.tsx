'use client';

import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import type { BuilderNode, BuilderEdge } from '@/types/builder';
import FlowNode from './FlowNode';
import FlowEdge from './FlowEdge';

// ── Constants ──
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const NODE_WIDTH = 140;
const NODE_HEIGHT = 64;
const HANDLE_RADIUS = 6;
const HANDLE_OFFSET = 15;
const GRID_SIZE = 24;
const WHEEL_ZOOM_FACTOR = 0.001;

// ── Props ──

interface FlowCanvasProps {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  viewport: { x: number; y: number; zoom: number };
  selectedNodeId: string | null;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeDelete: (nodeId: string) => void;
  onEdgeCreate: (source: string, target: string, handleIndex?: number) => void;
  onEdgeDelete: (edgeId: string) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
}

// ── Helpers ──

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

// ── Component ──

function FlowCanvasInner({
  nodes,
  edges,
  viewport,
  selectedNodeId,
  onNodeMove,
  onNodeSelect,
  onNodeDelete,
  onEdgeCreate,
  onEdgeDelete,
  onViewportChange,
}: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Local interaction state
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    handleIndex: number;
  } | null>(null);
  const [connectPointer, setConnectPointer] = useState<{ x: number; y: number } | null>(null);

  // Pan state ref (not re-rendering during pan)
  const panRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
    startVpX: number;
    startVpY: number;
    pointerId: number;
  } | null>(null);

  // Pinch state ref
  const pinchRef = useRef<{
    initialDist: number;
    initialZoom: number;
    midX: number;
    midY: number;
  } | null>(null);

  // Node lookup map
  const nodeMap = useMemo(() => {
    const m = new Map<string, BuilderNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  // Outgoing edge count per node
  const outgoingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of edges) {
      counts.set(e.source, (counts.get(e.source) || 0) + 1);
    }
    return counts;
  }, [edges]);

  // ── Client → SVG world coordinate conversion ──

  const clientToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;
      return {
        x: (cx - viewport.x) / viewport.zoom,
        y: (cy - viewport.y) / viewport.zoom,
      };
    },
    [viewport],
  );

  // ── Canvas pan ──

  const handleContainerPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only start pan if click is on the canvas background (not a node/edge)
      if (e.target !== containerRef.current && e.target !== svgRef.current) return;
      // Single finger/mouse pan
      if (e.button !== 0) return;

      // Deselect
      onNodeSelect(null);
      setSelectedEdgeId(null);

      // If connecting, cancel
      if (connectingFrom) {
        setConnectingFrom(null);
        setConnectPointer(null);
        return;
      }

      panRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startVpX: viewport.x,
        startVpY: viewport.y,
        pointerId: e.pointerId,
      };

      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [viewport.x, viewport.y, onNodeSelect, connectingFrom],
  );

  const handleContainerPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Connection line tracking
      if (connectingFrom) {
        const world = clientToWorld(e.clientX, e.clientY);
        setConnectPointer(world);
        return;
      }

      // Pan
      const pan = panRef.current;
      if (!pan || !pan.isPanning) return;
      if (pan.pointerId !== e.pointerId) return;

      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      onViewportChange({
        x: pan.startVpX + dx,
        y: pan.startVpY + dy,
        zoom: viewport.zoom,
      });
    },
    [viewport.zoom, onViewportChange, connectingFrom, clientToWorld],
  );

  const handleContainerPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Connection drop → find target node
      if (connectingFrom) {
        const world = clientToWorld(e.clientX, e.clientY);
        // Hit test: find node at this position
        const targetNode = nodes.find(
          (n) =>
            n.id !== connectingFrom.nodeId &&
            world.x >= n.position.x &&
            world.x <= n.position.x + NODE_WIDTH &&
            world.y >= n.position.y &&
            world.y <= n.position.y + NODE_HEIGHT,
        );
        if (targetNode) {
          onEdgeCreate(connectingFrom.nodeId, targetNode.id, connectingFrom.handleIndex);
        }
        setConnectingFrom(null);
        setConnectPointer(null);
        return;
      }

      const pan = panRef.current;
      if (pan && pan.pointerId === e.pointerId) {
        containerRef.current?.releasePointerCapture(e.pointerId);
        panRef.current = null;
      }
    },
    [connectingFrom, clientToWorld, nodes, onEdgeCreate],
  );

  // ── Mouse wheel zoom ──

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
      const newZoom = clampZoom(viewport.zoom + delta);
      if (newZoom === viewport.zoom) return;

      // Zoom toward cursor position
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const ratio = newZoom / viewport.zoom;
      const newX = cx - (cx - viewport.x) * ratio;
      const newY = cy - (cy - viewport.y) * ratio;

      onViewportChange({ x: newX, y: newY, zoom: newZoom });
    },
    [viewport, onViewportChange],
  );

  // ── Pinch zoom (touch) ──

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function getTouchDist(t1: Touch, t2: Touch): number {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        pinchRef.current = {
          initialDist: dist,
          initialZoom: viewport.zoom,
          midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        const ratio = dist / pinchRef.current.initialDist;
        const newZoom = clampZoom(pinchRef.current.initialZoom * ratio);
        if (newZoom !== viewport.zoom) {
          const rect = container!.getBoundingClientRect();
          const cx = pinchRef.current.midX - rect.left;
          const cy = pinchRef.current.midY - rect.top;
          const zoomRatio = newZoom / viewport.zoom;
          const newX = cx - (cx - viewport.x) * zoomRatio;
          const newY = cy - (cy - viewport.y) * zoomRatio;
          onViewportChange({ x: newX, y: newY, zoom: newZoom });
        }
      }
    };

    const onTouchEnd = () => {
      pinchRef.current = null;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [viewport, onViewportChange]);

  // ── Node event handlers ──

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      onNodeSelect(nodeId);
      setSelectedEdgeId(null);
    },
    [onNodeSelect],
  );

  const handleNodeDragStart = useCallback((_nodeId: string) => {
    // Visual feedback could be applied here
  }, []);

  const handleNodeDragMove = useCallback(
    (nodeId: string, x: number, y: number) => {
      onNodeMove(nodeId, { x, y });
    },
    [onNodeMove],
  );

  const handleNodeDragEnd = useCallback((_nodeId: string) => {
    // Drag ended, snap already applied in FlowNode
  }, []);

  const handleConnectStart = useCallback(
    (nodeId: string, handleIndex: number) => {
      setConnectingFrom({ nodeId, handleIndex });
      // Initialize connect pointer at handle position
      const node = nodeMap.get(nodeId);
      if (node) {
        let hx = node.position.x + NODE_WIDTH / 2;
        if (handleIndex === 0 && node.type === 'text') hx -= HANDLE_OFFSET;
        if (handleIndex === 1 && node.type === 'text') hx += HANDLE_OFFSET;
        const hy = node.position.y + NODE_HEIGHT + HANDLE_RADIUS + 2;
        setConnectPointer({ x: hx, y: hy });
      }
    },
    [nodeMap],
  );

  // ── Edge event handlers ──

  const handleEdgeSelect = useCallback(
    (edgeId: string) => {
      setSelectedEdgeId(edgeId);
      onNodeSelect(null);
    },
    [onNodeSelect],
  );

  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      onEdgeDelete(edgeId);
      setSelectedEdgeId(null);
    },
    [onEdgeDelete],
  );

  // ── Temporary connection line ──

  const tempConnectionPath = useMemo(() => {
    if (!connectingFrom || !connectPointer) return null;
    const srcNode = nodeMap.get(connectingFrom.nodeId);
    if (!srcNode) return null;

    let sx = srcNode.position.x + NODE_WIDTH / 2;
    if (connectingFrom.handleIndex === 0 && srcNode.type === 'text') sx -= HANDLE_OFFSET;
    if (connectingFrom.handleIndex === 1 && srcNode.type === 'text') sx += HANDLE_OFFSET;
    const sy = srcNode.position.y + NODE_HEIGHT + HANDLE_RADIUS + 2;

    const tx = connectPointer.x;
    const ty = connectPointer.y;
    const d = `M ${sx},${sy} C ${sx},${sy + 50} ${tx},${ty - 50} ${tx},${ty}`;

    return (
      <path
        d={d}
        fill="none"
        stroke="#fbbf24"
        strokeWidth={2}
        strokeDasharray="6 4"
        strokeOpacity={0.7}
        style={{ pointerEvents: 'none' }}
      />
    );
  }, [connectingFrom, connectPointer, nodeMap]);

  // Prevent default wheel at the DOM level so the page doesn't scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preventDefault = (e: WheelEvent) => e.preventDefault();
    container.addEventListener('wheel', preventDefault, { passive: false });
    return () => container.removeEventListener('wheel', preventDefault);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ touchAction: 'none', overflow: 'hidden', cursor: panRef.current?.isPanning ? 'grabbing' : 'default' }}
      onPointerDown={handleContainerPointerDown}
      onPointerMove={handleContainerPointerMove}
      onPointerUp={handleContainerPointerUp}
      onWheel={handleWheel}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: 'block', background: '#0d0907' }}
      >
        {/* Grid dot pattern */}
        <defs>
          <pattern
            id="grid-dots"
            x={viewport.x % (GRID_SIZE * viewport.zoom)}
            y={viewport.y % (GRID_SIZE * viewport.zoom)}
            width={GRID_SIZE * viewport.zoom}
            height={GRID_SIZE * viewport.zoom}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={GRID_SIZE * viewport.zoom / 2}
              cy={GRID_SIZE * viewport.zoom / 2}
              r={1}
              fill="rgba(92,60,42,0.125)"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dots)" />

        {/* Transform group for viewport */}
        <g
          data-viewport-group
          transform={`translate(${viewport.x},${viewport.y}) scale(${viewport.zoom})`}
        >
          {/* Edges */}
          {edges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            return (
              <FlowEdge
                key={edge.id}
                edge={edge}
                sourceNode={src}
                targetNode={tgt}
                isSelected={selectedEdgeId === edge.id}
                onSelect={handleEdgeSelect}
                onDelete={handleEdgeDelete}
              />
            );
          })}

          {/* Temp connection line */}
          {tempConnectionPath}

          {/* Nodes (render after edges so they're on top) */}
          {nodes.map((node) => (
            <FlowNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={handleNodeSelect}
              onDragStart={handleNodeDragStart}
              onDragMove={handleNodeDragMove}
              onDragEnd={handleNodeDragEnd}
              onDelete={onNodeDelete}
              onConnectStart={handleConnectStart}
              outgoingEdgeCount={outgoingCounts.get(node.id) || 0}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

const FlowCanvas = React.memo(FlowCanvasInner);
export default FlowCanvas;
