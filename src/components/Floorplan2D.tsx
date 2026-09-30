import React, { useRef, useState, useEffect } from 'react';
import { RoomSettings, PlacedFurniture, LightingEnvironment } from '../types/room';

interface Floorplan2DProps {
  roomSettings: RoomSettings;
  lighting: LightingEnvironment;
  furniture: PlacedFurniture[];
  selectedFurnitureId: string | null;
  onSelectFurniture: (id: string | null) => void;
  onUpdateFurniture: (updatedItem: PlacedFurniture) => void;
  onEditStart: () => void;
  onDropNewItem?: (catalogId: string, x: number, z: number) => void;
  gridSnap: number;
}

export const Floorplan2D: React.FC<Floorplan2DProps> = ({
  roomSettings,
  lighting,
  furniture,
  selectedFurnitureId,
  onSelectFurniture,
  onUpdateFurniture,
  onEditStart,
  onDropNewItem,
  gridSnap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom
  const [zoom, setZoom] = useState(65); // Pixels per meter
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Furniture dragging & rotating
  const [dragState, setDragState] = useState<{
    itemId: string;
    isRotating: boolean;
    startX: number;
    startY: number;
    itemStartX: number;
    itemStartZ: number;
    initialRotation: number;
  } | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  // Auto-center room on mount or resize
  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      setPan({ x: w / 2, y: h / 2 });
    }
  }, []);

  // Convert meters to canvas pixels
  const mToPx = (meters: number) => meters * zoom;
  const pxToM = (pixels: number) => pixels / zoom;

  // Convert screen coordinates to room meters (0,0 is center of room)
  const screenToRoom = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, z: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const mouseCanvasX = clientX - rect.left;
    const mouseCanvasY = clientY - rect.top;
    const roomX = (mouseCanvasX - pan.x) / zoom;
    const roomZ = (mouseCanvasY - pan.y) / zoom;
    return { x: roomX, z: roomZ };
  };

  // ---------------------------------------------------------------
  // MOUSE & POINTER HANDLERS
  // ---------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || e.button === 0) {
      // Pan background
      setIsPanning(true);
      containerRef.current?.setPointerCapture(e.pointerId);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      if (e.button === 0) {
        onSelectFurniture(null);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (dragState) {
      const currentItem = furniture.find((f) => f.id === dragState.itemId);
      if (!currentItem) return;

      if (dragState.isRotating) {
        // Calculate angle between item center on screen and current mouse
        const itemCenterScreenX = pan.x + mToPx(currentItem.x);
        const itemCenterScreenY = pan.y + mToPx(currentItem.z);
        const deltaX = e.clientX - (containerRef.current?.getBoundingClientRect().left || 0) - itemCenterScreenX;
        const deltaY = e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) - itemCenterScreenY;
        let deg = (-(Math.atan2(deltaY, deltaX) * 180) / Math.PI - 90 + 360) % 360;

        // 15-degree snap
        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
        }

        onUpdateFurniture({
          ...currentItem,
          rotation: Math.round(deg),
        });
      } else {
        // Drag position
        const deltaPxX = e.clientX - dragState.startX;
        const deltaPxY = e.clientY - dragState.startY;
        let newX = dragState.itemStartX + pxToM(deltaPxX);
        let newZ = dragState.itemStartZ + pxToM(deltaPxY);

        if (gridSnap > 0) {
          newX = Math.round(newX / gridSnap) * gridSnap;
          newZ = Math.round(newZ / gridSnap) * gridSnap;
        }

        onUpdateFurniture({
          ...currentItem,
          x: newX,
          z: newZ,
        });
      }
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setDragState(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    setZoom((prev) => Math.max(25, Math.min(180, prev * factor)));
  };

  // ---------------------------------------------------------------
  // DRAG & DROP FROM SIDEBAR
  // ---------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const catalogId = e.dataTransfer.getData('application/luminaspace-catalog-id');
    if (!catalogId || !onDropNewItem) return;

    let { x, z } = screenToRoom(e.clientX, e.clientY);

    if (gridSnap > 0) {
      x = Math.round(x / gridSnap) * gridSnap;
      z = Math.round(z / gridSnap) * gridSnap;
    }

    onDropNewItem(catalogId, x, z);
  };

  const roomPxW = mToPx(roomSettings.width);
  const roomPxL = mToPx(roomSettings.length);
  const wallPxThickness = Math.max(6, mToPx(roomSettings.wallThickness));

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full bg-neutral-950 overflow-hidden cursor-crosshair select-none"
    >
      {/* SVG Canvas for Floorplan */}
      <svg className="w-full h-full pointer-events-auto">
        <defs>
          {/* Subtle 0.5m & 1.0m CAD Grid */}
          <pattern
            id="subGrid"
            width={mToPx(0.5)}
            height={mToPx(0.5)}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${mToPx(0.5)} 0 L 0 0 0 ${mToPx(0.5)}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="majorGrid"
            width={mToPx(1.0)}
            height={mToPx(1.0)}
            patternUnits="userSpaceOnUse"
          >
            <rect width={mToPx(1.0)} height={mToPx(1.0)} fill="url(#subGrid)" />
            <path
              d={`M ${mToPx(1.0)} 0 L 0 0 0 ${mToPx(1.0)}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1.2"
            />
          </pattern>

          {/* Wall Hatch Pattern */}
          <pattern id="wallHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          </pattern>
        </defs>

        {/* Global Background Grid */}
        <rect
          data-export-ignore
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#majorGrid)"
          transform={`translate(${pan.x % mToPx(1.0)}, ${pan.y % mToPx(1.0)})`}
        />

        {/* Room Group centered at pan coordinates */}
        <g data-floorplan-room transform={`translate(${pan.x}, ${pan.y})`}>
          {/* Floor Interior Plate */}
          <rect
            x={-roomPxW / 2}
            y={-roomPxL / 2}
            width={roomPxW}
            height={roomPxL}
            fill="#121620"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />

          {/* Sun angle arrow on floorplan */}
          {lighting.sunIntensity > 0.1 && (
            <g transform={`rotate(${lighting.sunAzimuth})`}>
              <line
                x1="0"
                y1={-roomPxL / 2 - 40}
                x2="0"
                y2={-roomPxL / 2 - 10}
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <polygon
                points={`0,${-roomPxL / 2 - 5} -4,${-roomPxL / 2 - 14} 4,${-roomPxL / 2 - 14}`}
                fill="#F59E0B"
              />
              <text
                x="0"
                y={-roomPxL / 2 - 46}
                textAnchor="middle"
                fill="#F59E0B"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                Sunlight
              </text>
            </g>
          )}

          {/* Furniture Elements */}
          {furniture.map((item) => {
            const itemPxW = mToPx(item.dimensions.width * item.scaleX);
            const itemPxD = mToPx(item.dimensions.depth * item.scaleZ);
            const itemScreenX = mToPx(item.x);
            const itemScreenZ = mToPx(item.z);
            const isSelected = item.id === selectedFurnitureId;

            return (
              <g
                key={item.id}
                transform={`translate(${itemScreenX}, ${itemScreenZ}) rotate(${-item.rotation})`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  containerRef.current?.setPointerCapture(e.pointerId);
                  onEditStart();
                  onSelectFurniture(item.id);
                  setDragState({
                    itemId: item.id,
                    isRotating: false,
                    startX: e.clientX,
                    startY: e.clientY,
                    itemStartX: item.x,
                    itemStartZ: item.z,
                    initialRotation: item.rotation,
                  });
                }}
                className="cursor-move"
              >
                {/* Light radius indicator if fixture */}
                {item.isLightSource && item.lightEnabled !== false && (
                  <circle
                    data-export-ignore
                    pointerEvents="none"
                    cx="0"
                    cy="0"
                    r={mToPx((item.lightConfig?.distance || 5) * 0.45)}
                    fill={item.lightConfig?.color || '#F59E0B'}
                    fillOpacity="0.08"
                    stroke={item.lightConfig?.color || '#F59E0B'}
                    strokeOpacity="0.3"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Furniture Body Footprint */}
                <rect
                  x={-itemPxW / 2}
                  y={-itemPxD / 2}
                  width={itemPxW}
                  height={itemPxD}
                  rx="3"
                  fill={item.color}
                  fillOpacity="0.88"
                  stroke={isSelected ? '#F59E0B' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={isSelected ? '2.5' : '1'}
                />

                {/* Front Orientation Indicator */}
                <line
                  x1={-itemPxW / 2}
                  y1={itemPxD / 2}
                  x2={itemPxW / 2}
                  y2={itemPxD / 2}
                  stroke={isSelected ? '#F59E0B' : 'rgba(255,255,255,0.8)'}
                  strokeWidth="2.5"
                />

                {/* Label */}
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={Math.max(9, Math.min(12, itemPxW * 0.16))}
                  fontWeight="600"
                  className="pointer-events-none drop-shadow-md select-none font-sans"
                >
                  {item.name.split(' ')[0]}
                </text>

                {/* Selection & Rotation Handles */}
                {isSelected && (
                  <g>
                    {/* Bounding outline */}
                    <rect
                      x={-itemPxW / 2 - 4}
                      y={-itemPxD / 2 - 4}
                      width={itemPxW + 8}
                      height={itemPxD + 8}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    {/* Rotation stem & knob */}
                    <line x1="0" y1={-itemPxD / 2 - 4} x2="0" y2={-itemPxD / 2 - 24} stroke="#F59E0B" strokeWidth="2" />
                    <circle
                      cx="0"
                      cy={-itemPxD / 2 - 24}
                      r="6"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className="cursor-pointer"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        containerRef.current?.setPointerCapture(e.pointerId);
                        onEditStart();
                        setDragState({
                          itemId: item.id,
                          isRotating: true,
                          startX: e.clientX,
                          startY: e.clientY,
                          itemStartX: item.x,
                          itemStartZ: item.z,
                          initialRotation: item.rotation,
                        });
                      }}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Outer Room Walls (CAD Hatch) */}
          {/* North Wall */}
          <rect
            x={-roomPxW / 2 - wallPxThickness}
            y={-roomPxL / 2 - wallPxThickness}
            width={roomPxW + wallPxThickness * 2}
            height={wallPxThickness}
            fill="url(#wallHatch)"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          {/* South Wall */}
          <rect
            x={-roomPxW / 2 - wallPxThickness}
            y={roomPxL / 2}
            width={roomPxW + wallPxThickness * 2}
            height={wallPxThickness}
            fill="url(#wallHatch)"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          {/* West Wall */}
          <rect
            x={-roomPxW / 2 - wallPxThickness}
            y={-roomPxL / 2}
            width={wallPxThickness}
            height={roomPxL}
            fill="url(#wallHatch)"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          {/* East Wall */}
          <rect
            x={roomPxW / 2}
            y={-roomPxL / 2}
            width={wallPxThickness}
            height={roomPxL}
            fill="url(#wallHatch)"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />

          {/* Architectural Dimension Callouts */}
          {/* Top Width Dimension Line */}
          <g transform={`translate(0, ${-roomPxL / 2 - wallPxThickness - 20})`}>
            <line x1={-roomPxW / 2} y1="0" x2={roomPxW / 2} y2="0" stroke="#94A3B8" strokeWidth="1" />
            <line x1={-roomPxW / 2} y1="-6" x2={-roomPxW / 2} y2="6" stroke="#94A3B8" strokeWidth="1" />
            <line x1={roomPxW / 2} y1="-6" x2={roomPxW / 2} y2="6" stroke="#94A3B8" strokeWidth="1" />
            <rect x="-35" y="-12" width="70" height="24" fill="#0A0D14" rx="3" />
            <text x="0" y="4" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontFamily="var(--font-mono)">
              {roomSettings.width.toFixed(2)} m
            </text>
          </g>

          {/* Left Length Dimension Line */}
          <g transform={`translate(${-roomPxW / 2 - wallPxThickness - 20}, 0)`}>
            <line x1="0" y1={-roomPxL / 2} x2="0" y2={roomPxL / 2} stroke="#94A3B8" strokeWidth="1" />
            <line x1="-6" y1={-roomPxL / 2} x2="6" y2={-roomPxL / 2} stroke="#94A3B8" strokeWidth="1" />
            <line x1="-6" y1={roomPxL / 2} x2="6" y2={roomPxL / 2} stroke="#94A3B8" strokeWidth="1" />
            <rect x="-12" y="-35" width="24" height="70" fill="#0A0D14" rx="3" />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              transform="rotate(-90)"
              fill="#E2E8F0"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              {roomSettings.length.toFixed(2)} m
            </text>
          </g>

          {/* Room Area Label Center */}
          <text
            x="0"
            y={roomPxL / 2 - 16}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.4)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            {(roomSettings.width * roomSettings.length).toFixed(1)} m² ·{' '}
            {((roomSettings.width * roomSettings.length) * 10.7639).toFixed(0)} sq ft
          </text>
        </g>
      </svg>

      {/* North Compass Indicator in Top-Right */}
      <div className="absolute top-4 right-4 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-lg p-2.5 flex items-center gap-2 pointer-events-none text-xs text-neutral-400">
        <div className="w-5 h-5 flex items-center justify-center font-bold text-amber-400 border border-amber-400/40 rounded-full font-mono text-[10px]">
          N
        </div>
        <span>2D Floorplan CAD</span>
      </div>

      {/* Drag Over Hint */}
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/80 bg-amber-500/10 flex items-center justify-center">
          <div className="bg-neutral-900/95 text-amber-300 px-4 py-2 rounded-lg text-xs font-semibold backdrop-blur-md shadow-2xl border border-amber-500/40">
            Drop into Room Blueprint
          </div>
        </div>
      )}
    </div>
  );
};
