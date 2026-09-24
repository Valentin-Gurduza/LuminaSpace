import React from 'react';
import {
  Compass,
  Box,
  Eye,
  Camera,
  FolderOpen,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { ViewMode } from '../types/room';

interface TopNavbarProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  onOpenPresets: () => void;
  onTakeSnapshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearRoom: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  viewMode,
  onSetViewMode,
  onOpenPresets,
  onTakeSnapshot,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearRoom,
}) => {
  return (
    <header className="relative z-30 flex items-center justify-between px-6 py-3.5 bg-neutral-900/90 border-b border-neutral-800 backdrop-blur-md shrink-0">
      {/* Zone 1: Brand Wordmark (Single Text Element) */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight text-neutral-100 font-display">
          LuminaSpace
        </span>
      </div>

      {/* Zone 2: View Modes (Segmented Control, Single-Line) */}
      <nav className="flex items-center gap-1 p-1 bg-neutral-950/80 rounded-lg border border-neutral-800">
        <button
          onClick={() => onSetViewMode('3d-orbit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            viewMode === '3d-orbit'
              ? 'bg-neutral-800 text-amber-300 shadow-sm border border-neutral-700/80'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          3D Orbit
        </button>

        <button
          onClick={() => onSetViewMode('2d-plan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            viewMode === '2d-plan'
              ? 'bg-neutral-800 text-amber-300 shadow-sm border border-neutral-700/80'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          2D Floorplan
        </button>

        <button
          onClick={() => onSetViewMode('first-person')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            viewMode === 'first-person'
              ? 'bg-neutral-800 text-amber-300 shadow-sm border border-neutral-700/80'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Walkthrough
        </button>

        <button
          onClick={() => onSetViewMode('isometric')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            viewMode === 'isometric'
              ? 'bg-neutral-800 text-amber-300 shadow-sm border border-neutral-700/80'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Isometric
        </button>
      </nav>

      {/* Zone 3: Primary Actions (1-2 main CTAs + quiet tool buttons) */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-1 border-r border-neutral-800 pr-2 mr-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:hover:text-neutral-400 rounded hover:bg-neutral-800/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:hover:text-neutral-400 rounded hover:bg-neutral-800/80 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearRoom}
            title="Clear all furniture"
            className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800/80 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Room Presets Modal Opener */}
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          Templates
        </button>

        {/* Render Snapshot Button */}
        <button
          onClick={onTakeSnapshot}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer hover:shadow-amber-500/20 hover:shadow-md"
        >
          <Camera className="w-3.5 h-3.5" />
          Export Render
        </button>
      </div>
    </header>
  );
};
