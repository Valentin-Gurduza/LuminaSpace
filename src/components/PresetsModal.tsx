import React, { useRef } from 'react';
import { X, Check, Download, Upload, Sparkles, Box } from 'lucide-react';
import { RoomPreset, RoomSettings, LightingEnvironment, PlacedFurniture } from '../types/room';
import { ROOM_PRESETS } from '../data/roomPresets';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: RoomPreset) => void;
  onImportLayout: (data: {
    roomSettings: RoomSettings;
    lighting: LightingEnvironment;
    furniture: PlacedFurniture[];
  }) => void;
  currentLayout: {
    roomSettings: RoomSettings;
    lighting: LightingEnvironment;
    furniture: PlacedFurniture[];
  };
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onImportLayout,
  currentLayout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export current room to JSON
  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(currentLayout, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `luminaspace-room-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import room from JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.roomSettings && parsed.furniture) {
          onImportLayout(parsed);
          onClose();
        } else {
          alert('Invalid layout file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-100 font-display">
              Room Templates & Studio Layouts
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Choose a designer room template or backup your layout.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {ROOM_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="group relative p-4 bg-neutral-950/70 hover:bg-neutral-800/40 border border-neutral-800 hover:border-amber-500/40 rounded-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-amber-300 transition-colors">
                      {preset.name}
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                    {preset.tagline}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 mb-4">
                    <span>
                      {preset.roomSettings.width}m × {preset.roomSettings.length}m
                    </span>
                    <span>·</span>
                    <span>{preset.furniture.length} items</span>
                    <span>·</span>
                    <span className="text-amber-400/90">{preset.lighting.presetName}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-neutral-800 hover:bg-amber-500 text-neutral-200 hover:text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Load Template
                </button>
              </div>
            ))}
          </div>

          {/* Import / Export JSON section */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-neutral-400">
              Save or load your custom room arrangement:
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer border border-neutral-700"
              >
                <Upload className="w-3.5 h-3.5" />
                Import JSON
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer border border-neutral-700"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
