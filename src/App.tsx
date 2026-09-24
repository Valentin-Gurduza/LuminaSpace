/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode, RoomSettings, LightingEnvironment, PlacedFurniture, RoomPreset } from './types/room';
import { ROOM_PRESETS } from './data/roomPresets';
import { FURNITURE_CATALOG } from './data/furnitureCatalog';
import { LIGHTING_PRESETS } from './data/lightingPresets';
import { TopNavbar } from './components/TopNavbar';
import { CatalogSidebar } from './components/CatalogSidebar';
import { InspectorSidebar } from './components/InspectorSidebar';
import { Viewport3D } from './components/Viewport3D';
import { Floorplan2D } from './components/Floorplan2D';
import { BottomToolbar } from './components/BottomToolbar';
import { PresetsModal } from './components/PresetsModal';
import { SnapshotModal } from './components/SnapshotModal';

export default function App() {
  // Initial default: Scandinavian living room template
  const initialPreset = ROOM_PRESETS[0];

  const [viewMode, setViewMode] = useState<ViewMode>('3d-orbit');
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(initialPreset.roomSettings);
  const [lighting, setLighting] = useState<LightingEnvironment>(initialPreset.lighting);
  const [furniture, setFurniture] = useState<PlacedFurniture[]>(initialPreset.furniture);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);

  const [gridSnap, setGridSnap] = useState<number>(0.25);
  const [cutawayFrontWall, setCutawayFrontWall] = useState<boolean>(true);

  // Sidebars visibility
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Modals
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState<boolean>(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<PlacedFurniture[][]>([initialPreset.furniture]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Push new state to history
  const pushHistory = useCallback(
    (newFurniture: PlacedFurniture[]) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newFurniture];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setFurniture(history[prevIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setFurniture(history[nextIndex]);
    }
  }, [historyIndex, history]);

  // -----------------------------------------------------------------
  // FURNITURE OPERATIONS
  // -----------------------------------------------------------------
  const handleAddItem = (catalogId: string, x = 0, z = 0) => {
    const itemDef = FURNITURE_CATALOG.find((c) => c.id === catalogId);
    if (!itemDef) return;

    const newItem: PlacedFurniture = {
      id: `furn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      catalogId: itemDef.id,
      name: itemDef.name,
      category: itemDef.category,
      x,
      z,
      y: itemDef.isCeilingMounted ? roomSettings.height - itemDef.dimensions.height : 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      color: itemDef.defaultColor,
      secondaryColor: itemDef.secondaryColor,
      materialType: itemDef.materialType,
      dimensions: { ...itemDef.dimensions },
      isLightSource: itemDef.isLightSource,
      lightConfig: itemDef.defaultLight ? { ...itemDef.defaultLight } : undefined,
      lightEnabled: true,
      isCeilingMounted: itemDef.isCeilingMounted,
      isWallMounted: itemDef.isWallMounted,
    };

    const nextFurniture = [...furniture, newItem];
    setFurniture(nextFurniture);
    pushHistory(nextFurniture);
    setSelectedFurnitureId(newItem.id);
  };

  const handleUpdateFurniture = (updatedItem: PlacedFurniture) => {
    const nextFurniture = furniture.map((f) => (f.id === updatedItem.id ? updatedItem : f));
    setFurniture(nextFurniture);
  };

  const handleDeleteFurniture = (id: string) => {
    const nextFurniture = furniture.filter((f) => f.id !== id);
    setFurniture(nextFurniture);
    pushHistory(nextFurniture);
    if (selectedFurnitureId === id) {
      setSelectedFurnitureId(null);
    }
  };

  const handleDuplicateFurniture = (id: string) => {
    const original = furniture.find((f) => f.id === id);
    if (!original) return;

    const duplicated: PlacedFurniture = {
      ...original,
      id: `furn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: original.x + 0.35,
      z: original.z + 0.35,
    };

    const nextFurniture = [...furniture, duplicated];
    setFurniture(nextFurniture);
    pushHistory(nextFurniture);
    setSelectedFurnitureId(duplicated.id);
  };

  const handleClearRoom = () => {
    if (window.confirm('Clear all furniture in the room?')) {
      setFurniture([]);
      pushHistory([]);
      setSelectedFurnitureId(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFurnitureId) {
          e.preventDefault();
          handleDeleteFurniture(selectedFurnitureId);
        }
      }
      // Duplicate selected: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedFurnitureId) {
          e.preventDefault();
          handleDuplicateFurniture(selectedFurnitureId);
        }
      }
      // Escape: deselect
      if (e.key === 'Escape') {
        setSelectedFurnitureId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFurnitureId, handleUndo, handleRedo, furniture]);

  // Load preset template
  const handleSelectPreset = (preset: RoomPreset) => {
    setRoomSettings(preset.roomSettings);
    setLighting(preset.lighting);
    setFurniture(preset.furniture);
    setHistory([preset.furniture]);
    setHistoryIndex(0);
    setSelectedFurnitureId(null);
  };

  // Import custom JSON
  const handleImportLayout = (data: {
    roomSettings: RoomSettings;
    lighting: LightingEnvironment;
    furniture: PlacedFurniture[];
  }) => {
    setRoomSettings(data.roomSettings);
    setLighting(data.lighting);
    setFurniture(data.furniture);
    setHistory([data.furniture]);
    setHistoryIndex(0);
    setSelectedFurnitureId(null);
  };

  // Take high-res snapshot of current 3D/2D canvas
  const handleTakeSnapshot = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setSnapshotUrl(dataUrl);
    } else {
      // In 2D SVG mode, serialize SVG to canvas
      const svg = document.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        const image = new Image();
        image.onload = () => {
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = svg.clientWidth || 1200;
          offscreenCanvas.height = svg.clientHeight || 800;
          const ctx = offscreenCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0A0D14';
            ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            ctx.drawImage(image, 0, 0);
            setSnapshotUrl(offscreenCanvas.toDataURL('image/png'));
          }
        };
        image.src = blobURL;
      }
    }
  };

  const selectedFurniture = furniture.find((f) => f.id === selectedFurnitureId) || null;
  const fixturesCount = furniture.filter((f) => f.isLightSource && f.lightEnabled !== false).length;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans select-none">
      {/* Top Bar Contract (Wordmark - View Modes - Primary Actions) */}
      <TopNavbar
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onOpenPresets={() => setIsPresetsModalOpen(true)}
        onTakeSnapshot={handleTakeSnapshot}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearRoom={handleClearRoom}
      />

      {/* Main Workspace Body */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Furniture & Lighting Catalog */}
        <CatalogSidebar
          isOpen={isCatalogOpen}
          onToggleOpen={() => setIsCatalogOpen((prev) => !prev)}
          onAddItem={(catalogId) => handleAddItem(catalogId, 0, 0)}
        />

        {/* Center Viewport Area */}
        <main className="relative flex-1 h-full overflow-hidden bg-neutral-950">
          {viewMode === '2d-plan' ? (
            <Floorplan2D
              roomSettings={roomSettings}
              lighting={lighting}
              furniture={furniture}
              selectedFurnitureId={selectedFurnitureId}
              onSelectFurniture={setSelectedFurnitureId}
              onUpdateFurniture={handleUpdateFurniture}
              onDropNewItem={(catalogId, x, z) => handleAddItem(catalogId, x, z)}
              gridSnap={gridSnap}
            />
          ) : (
            <Viewport3D
              viewMode={viewMode}
              roomSettings={roomSettings}
              lighting={lighting}
              furniture={furniture}
              selectedFurnitureId={selectedFurnitureId}
              onSelectFurniture={setSelectedFurnitureId}
              onUpdateFurniture={handleUpdateFurniture}
              onDropNewItem={(catalogId, x, z) => handleAddItem(catalogId, x, z)}
              gridSnap={gridSnap}
              cutawayFrontWall={cutawayFrontWall}
            />
          )}

          {/* Floating Bottom HUD Toolbar */}
          <BottomToolbar
            viewMode={viewMode}
            gridSnap={gridSnap}
            onSetGridSnap={setGridSnap}
            furnitureCount={furniture.length}
            fixturesCount={fixturesCount}
            roomSettings={roomSettings}
            lighting={lighting}
          />
        </main>

        {/* Right Inspector & Lighting Studio Sidebar */}
        <InspectorSidebar
          selectedFurniture={selectedFurniture}
          onUpdateFurniture={handleUpdateFurniture}
          onDeleteFurniture={handleDeleteFurniture}
          onDuplicateFurniture={handleDuplicateFurniture}
          onDeselect={() => setSelectedFurnitureId(null)}
          roomSettings={roomSettings}
          onUpdateRoomSettings={setRoomSettings}
          lighting={lighting}
          onUpdateLighting={setLighting}
          furniture={furniture}
          isOpen={isInspectorOpen}
          onToggleOpen={() => setIsInspectorOpen((prev) => !prev)}
          cutawayFrontWall={cutawayFrontWall}
          onToggleCutaway={() => setCutawayFrontWall((prev) => !prev)}
        />
      </div>

      {/* Room Templates & Layout Backup Modal */}
      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        onImportLayout={handleImportLayout}
        currentLayout={{
          roomSettings,
          lighting,
          furniture,
        }}
      />

      {/* Snapshot High-Res Export Preview Modal */}
      <SnapshotModal
        isOpen={!!snapshotUrl}
        onClose={() => setSnapshotUrl(null)}
        imageUrl={snapshotUrl}
        lightingName={lighting.presetName}
      />
    </div>
  );
}
