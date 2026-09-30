import React from 'react';
import { Grid, Eye, Compass, Sun, Zap, Info } from 'lucide-react';
import { ViewMode, RoomSettings, LightingEnvironment } from '../types/room';

interface BottomToolbarProps {
  viewMode: ViewMode;
  gridSnap: number;
  onSetGridSnap: (snap: number) => void;
  furnitureCount: number;
  fixturesCount: number;
  roomSettings: RoomSettings;
  lighting: LightingEnvironment;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  viewMode,
  gridSnap,
  onSetGridSnap,
  furnitureCount,
  fixturesCount,
  roomSettings,
  lighting,
}) => {
  const roomAreaM2 = (roomSettings.width * roomSettings.length).toFixed(1);
  const roomAreaSqFt = ((roomSettings.width * roomSettings.length) * 10.7639).toFixed(0);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex w-full flex-col items-center gap-2 max-w-full px-2 pointer-events-none sm:bottom-5 sm:w-auto sm:flex-row">
      {/* Walkthrough Controls Guide (Only in first-person mode) */}
      {viewMode === 'first-person' && (
        <div className="pointer-events-auto flex max-w-full flex-wrap justify-center items-center gap-2 px-3 py-2 bg-neutral-900/90 border border-amber-500/30 rounded-xl backdrop-blur-md text-xs text-neutral-300 shadow-xl">
          <div className="flex items-center gap-1 font-mono text-amber-400 font-semibold text-[11px]">
            <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded">W</span>
            <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded">A</span>
            <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded">S</span>
            <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded">D</span>
          </div>
          <span>Walk</span>
          <span className="text-neutral-600">·</span>
          <span>Click & Drag to Look</span>
        </div>
      )}

      {/* Main HUD Bar */}
      <div className="pointer-events-auto flex max-w-full flex-wrap justify-center items-center gap-2 px-2 py-2 bg-neutral-900/90 border border-neutral-800/90 rounded-xl backdrop-blur-md text-xs shadow-2xl text-neutral-300 sm:gap-4 sm:px-4">
        {/* Grid Snap Control */}
        <div className="flex items-center gap-2 border-r border-neutral-800 pr-3">
          <Grid className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] text-neutral-400 hidden sm:inline">Snap:</span>
          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
            {[
              { label: 'Off', val: 0 },
              { label: '0.1m', val: 0.1 },
              { label: '0.25m', val: 0.25 },
              { label: '0.5m', val: 0.5 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => onSetGridSnap(s.val)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  gridSnap === s.val
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Room Area Stats */}
        <div className="flex items-center gap-2 whitespace-nowrap text-neutral-400 font-mono text-[11px] sm:gap-3">
          <span className="hidden md:inline">
            <strong className="text-neutral-200">{roomAreaM2}</strong> m² ({roomAreaSqFt} sq ft)
          </span>
          <span className="text-neutral-700 hidden md:inline">·</span>
          <span>
            <strong className="text-neutral-200">{furnitureCount}</strong> items
          </span>
          <span className="text-neutral-700">·</span>
          <span className="flex items-center gap-1 text-amber-400">
            <Zap className="w-3 h-3 fill-amber-400" />
            <strong>{fixturesCount}</strong> lights
          </span>
        </div>
      </div>
    </div>
  );
};
