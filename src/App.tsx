/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { ViewMode, RoomSettings, LightingEnvironment, PlacedFurniture, RoomPreset } from './types/room';
import { ROOM_PRESETS } from './data/roomPresets';
import { FURNITURE_CATALOG } from './data/furnitureCatalog';
import { createHistory, historyReducer } from './utils/history';
import { captureScene } from './utils/captureScene';
import { clampFurniture } from './utils/layout';
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
  const [history, dispatchHistory] = useReducer(historyReducer, initialPreset, preset => createHistory({ roomSettings: preset.roomSettings, lighting: preset.lighting, furniture: preset.furniture.map(item => clampFurniture(item, preset.roomSettings)) }));
  const { roomSettings, lighting, furniture } = history.present;
  const viewportRef = useRef<HTMLElement>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);

  const [gridSnap, setGridSnap] = useState<number>(0.25);
  const [cutawayFrontWall, setCutawayFrontWall] = useState<boolean>(true);

  // Sidebars visibility
  const [isCatalogOpen, setIsCatalogOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [isInspectorOpen, setIsInspectorOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);

  // Modals
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState<boolean>(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const beginEdit = useCallback(() => dispatchHistory({ type: 'begin' }), []);
  const commitEdit = useCallback(() => dispatchHistory({ type: 'commit' }), []);
  const beginSceneEdit = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.matches('input, textarea, select')) active.blur();
    beginEdit();
  }, [beginEdit]);
  const handleUndo = useCallback(() => dispatchHistory({ type: 'undo' }), []);
  const handleRedo = useCallback(() => dispatchHistory({ type: 'redo' }), []);
  const setFurniture = (next: PlacedFurniture[]) => dispatchHistory({ type: 'update', update: layout => ({ ...layout, furniture: next }) });
  const setRoomSettings = (next: RoomSettings) => dispatchHistory({ type: 'update', update: layout => ({ ...layout, roomSettings: next, furniture: layout.furniture.map(item => clampFurniture(item, next)) }) });
  const setLighting = (next: LightingEnvironment) => dispatchHistory({ type: 'update', update: layout => ({ ...layout, lighting: next }) });

  useEffect(() => {
    const finishPointerEdit = () => {
      if (!document.activeElement?.matches('input[type="number"], input[type="color"]')) commitEdit();
    };
    window.addEventListener('pointerup', finishPointerEdit);
    window.addEventListener('pointercancel', finishPointerEdit);
    window.addEventListener('blur', commitEdit);
    const media = window.matchMedia('(min-width: 1024px)');
    const resize = () => {
      setIsCatalogOpen(media.matches);
      setIsInspectorOpen(media.matches);
    };
    media.addEventListener('change', resize);
    return () => {
      window.removeEventListener('pointerup', finishPointerEdit);
      window.removeEventListener('pointercancel', finishPointerEdit);
      window.removeEventListener('blur', commitEdit);
      media.removeEventListener('change', resize);
    };
  }, [commitEdit]);

  const selectFurniture = (id: string | null) => {
    setSelectedFurnitureId(id);
    if (id && !window.matchMedia('(min-width: 1024px)').matches) {
      setIsCatalogOpen(false);
      setIsInspectorOpen(true);
    }
  };
  const toggleCatalog = () => {
    setIsCatalogOpen(open => !open);
    if (!window.matchMedia('(min-width: 1024px)').matches) setIsInspectorOpen(false);
  };
  const toggleInspector = () => {
    setIsInspectorOpen(open => !open);
    if (!window.matchMedia('(min-width: 1024px)').matches) setIsCatalogOpen(false);
  };

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

    const nextFurniture = [...furniture, clampFurniture(newItem, roomSettings)];
    setFurniture(nextFurniture);
    selectFurniture(newItem.id);
  };

  const handleUpdateFurniture = (updatedItem: PlacedFurniture) => {
    const nextFurniture = furniture.map((f) => (f.id === updatedItem.id ? clampFurniture(updatedItem, roomSettings) : f));
    setFurniture(nextFurniture);
  };

  const handleDeleteFurniture = (id: string) => {
    const nextFurniture = furniture.filter((f) => f.id !== id);
    setFurniture(nextFurniture);
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

    const nextFurniture = [...furniture, clampFurniture(duplicated, roomSettings)];
    setFurniture(nextFurniture);
    selectFurniture(duplicated.id);
  };

  const handleClearRoom = () => {
    if (window.confirm('Clear all furniture in the room?')) {
      setFurniture([]);
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

  const handleSelectPreset = (preset: RoomPreset) => {
    dispatchHistory({ type: 'replace', layout: { roomSettings: preset.roomSettings, lighting: preset.lighting, furniture: preset.furniture.map(item => clampFurniture(item, preset.roomSettings)) } });
    setSelectedFurnitureId(null);
  };

  const handleImportLayout = (data: { roomSettings: RoomSettings; lighting: LightingEnvironment; furniture: PlacedFurniture[] }) => {
    dispatchHistory({ type: 'replace', layout: data });
    setSelectedFurnitureId(null);
  };

  const handleTakeSnapshot = async () => {
    if (!viewportRef.current) return;
    setExportError(null);
    try {
      setSnapshotUrl(await captureScene(viewportRef.current));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Image export failed.');
    }
  };

  const selectedFurniture = furniture.find((f) => f.id === selectedFurnitureId) || null;
  const fixturesCount = furniture.filter((f) => f.isLightSource && f.lightEnabled !== false).length;

  return (
    <div
      onPointerDownCapture={event => { if ((event.target as HTMLElement).matches('input[type="range"]')) beginEdit(); }}
      onFocusCapture={event => { if (event.target.matches('input[type="number"], input[type="color"], input[type="range"]')) beginEdit(); }}
      onBlurCapture={event => { if (event.target.matches('input[type="number"], input[type="color"], input[type="range"]')) commitEdit(); }}
      onKeyDownCapture={event => { if ((event.target as HTMLElement).matches('input[type="range"]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) beginEdit(); }}
      onKeyUpCapture={event => { if ((event.target as HTMLElement).matches('input[type="range"]')) commitEdit(); }}
      className="flex flex-col w-screen h-dvh overflow-hidden bg-neutral-950 text-neutral-100 font-sans select-none">
      {/* Top Bar Contract (Wordmark - View Modes - Primary Actions) */}
      <TopNavbar
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onOpenPresets={() => setIsPresetsModalOpen(true)}
        onTakeSnapshot={handleTakeSnapshot}
        canUndo={history.past.length > 0 || (!!history.editStart && history.present !== history.editStart)}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearRoom={handleClearRoom}
      />

      <div className="flex shrink-0 items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-3 py-2 lg:hidden">
        <button aria-expanded={isCatalogOpen} onClick={toggleCatalog} className="rounded bg-neutral-800 px-3 py-1.5 text-xs">Furniture</button>
        <button aria-expanded={isInspectorOpen} onClick={toggleInspector} className="rounded bg-neutral-800 px-3 py-1.5 text-xs">Inspector</button>
      </div>
      {exportError && <div role="alert" className="bg-red-950 px-4 py-2 text-sm text-red-200">{exportError}</div>}
      {/* Main Workspace Body */}
      <div className="relative min-h-0 flex-1 flex overflow-hidden">
        {/* Left Furniture & Lighting Catalog */}
        <CatalogSidebar
          isOpen={isCatalogOpen}
          onToggleOpen={toggleCatalog}
          onAddItem={(catalogId) => handleAddItem(catalogId, 0, 0)}
        />

        {/* Center Viewport Area */}
        <main ref={viewportRef} className="relative min-w-0 flex-1 h-full overflow-hidden bg-neutral-950">
          {viewMode === '2d-plan' ? (
            <Floorplan2D
              roomSettings={roomSettings}
              lighting={lighting}
              furniture={furniture}
              selectedFurnitureId={selectedFurnitureId}
              onSelectFurniture={selectFurniture}
              onEditStart={beginSceneEdit}
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
              onSelectFurniture={selectFurniture}
              onEditStart={beginSceneEdit}
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

        {(isCatalogOpen || isInspectorOpen) && <button aria-label="Close panels" onClick={() => { setIsCatalogOpen(false); setIsInspectorOpen(false); }} className="absolute inset-0 z-20 bg-black/40 lg:hidden" />}
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
          onToggleOpen={toggleInspector}
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
