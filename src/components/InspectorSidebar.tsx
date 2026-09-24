import React, { useState } from 'react';
import {
  Sun,
  Sliders,
  Home,
  Trash2,
  Copy,
  RotateCw,
  Zap,
  Eye,
  Layers,
  Sparkles,
  Maximize2,
  ArrowUp,
  X,
  ChevronLeft,
  ChevronRight,
  SunMedium,
  Moon,
  Clock,
  Palette,
} from 'lucide-react';
import {
  RoomSettings,
  LightingEnvironment,
  PlacedFurniture,
  FloorMaterialType,
  WallTextureType,
} from '../types/room';
import { LIGHTING_PRESETS } from '../data/lightingPresets';

interface InspectorSidebarProps {
  selectedFurniture: PlacedFurniture | null;
  onUpdateFurniture: (item: PlacedFurniture) => void;
  onDeleteFurniture: (id: string) => void;
  onDuplicateFurniture: (id: string) => void;
  onDeselect: () => void;
  roomSettings: RoomSettings;
  onUpdateRoomSettings: (settings: RoomSettings) => void;
  lighting: LightingEnvironment;
  onUpdateLighting: (lighting: LightingEnvironment) => void;
  furniture: PlacedFurniture[];
  isOpen: boolean;
  onToggleOpen: () => void;
  cutawayFrontWall: boolean;
  onToggleCutaway: () => void;
}

const FLOOR_MATERIALS: { id: FloorMaterialType; name: string; desc: string }[] = [
  { id: 'oak-hardwood', name: 'Oak Hardwood', desc: 'Natural golden Scandinavian planks' },
  { id: 'walnut-parquet', name: 'Walnut Parquet', desc: 'Deep warm architectural boards' },
  { id: 'chevron-wood', name: 'Chevron Wood', desc: 'Elegant angled European herringbone' },
  { id: 'carrara-marble', name: 'Carrara Marble', desc: 'Polished white Italian stone with veins' },
  { id: 'polished-concrete', name: 'Polished Concrete', desc: 'Urban loft aggregate finish' },
  { id: 'minimal-terrazzo', name: 'Terrazzo Plinth', desc: 'Speckled mineral composite' },
];

const WALL_TEXTURES: { id: WallTextureType; name: string }[] = [
  { id: 'smooth-matte', name: 'Smooth Matte Paint' },
  { id: 'subtle-plaster', name: 'Subtle Plaster Stucco' },
  { id: 'architectural-brick', name: 'Exposed White Brick' },
  { id: 'concrete-wash', name: 'Industrial Concrete Wash' },
  { id: 'vertical-wood', name: 'Vertical Acoustic Slats' },
];

const WALL_PRESET_COLORS = [
  '#F4F4F1',
  '#EAEAE5',
  '#E2E8F0',
  '#CBD5E1',
  '#94A3B8',
  '#475569',
  '#262626',
  '#18181B',
  '#3F2E23',
  '#1C2A39',
];

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  selectedFurniture,
  onUpdateFurniture,
  onDeleteFurniture,
  onDuplicateFurniture,
  onDeselect,
  roomSettings,
  onUpdateRoomSettings,
  lighting,
  onUpdateLighting,
  furniture,
  isOpen,
  onToggleOpen,
  cutawayFrontWall,
  onToggleCutaway,
}) => {
  const [activeTab, setActiveTab] = useState<'lighting' | 'room'>('lighting');

  const lightFixturesInRoom = furniture.filter((f) => f.isLightSource);

  // Format time of day helper (e.g. 17.5 -> "17:30 / 5:30 PM")
  const formatTime = (hourDecimal: number) => {
    const hours = Math.floor(hourDecimal);
    const minutes = Math.floor((hourDecimal - hours) * 60);
    const paddedM = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hours}:${paddedM} (${h12}:${paddedM} ${period})`;
  };

  return (
    <aside
      className={`relative z-20 flex flex-col bg-neutral-900/95 border-l border-neutral-800 backdrop-blur-md transition-all duration-300 ${
        isOpen ? 'w-84 min-w-84' : 'w-0 min-w-0 border-none'
      }`}
    >
      {/* Toggle Tab Button */}
      <button
        onClick={onToggleOpen}
        title={isOpen ? 'Collapse Panel' : 'Open Inspector & Lighting'}
        className="absolute -left-3.5 top-6 z-30 flex items-center justify-center w-7 h-7 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full border border-neutral-700 shadow-lg cursor-pointer transition-colors"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* ============================================================ */}
          {/* CASE A: A FURNITURE ITEM IS CURRENTLY SELECTED */}
          {/* ============================================================ */}
          {selectedFurniture ? (
            <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5">
              {/* Header with Deselect & Delete */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                    {selectedFurniture.category}
                  </span>
                  <h2 className="text-sm font-semibold text-neutral-100 truncate">
                    {selectedFurniture.name}
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicateFurniture(selectedFurniture.id)}
                    title="Duplicate Item"
                    className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteFurniture(selectedFurniture.id)}
                    title="Delete Item"
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDeselect}
                    title="Close Inspector"
                    className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transform & Position */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Transform & Rotation
                </h3>

                {/* X & Z Coordinates */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px]">X POSITION</span>
                    <div className="flex items-center gap-1 mt-1 text-neutral-200">
                      <input
                        type="number"
                        step="0.1"
                        value={selectedFurniture.x.toFixed(2)}
                        onChange={(e) =>
                          onUpdateFurniture({
                            ...selectedFurniture,
                            x: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-transparent focus:outline-none"
                      />
                      <span className="text-neutral-500 text-[10px]">m</span>
                    </div>
                  </div>

                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px]">Z POSITION</span>
                    <div className="flex items-center gap-1 mt-1 text-neutral-200">
                      <input
                        type="number"
                        step="0.1"
                        value={selectedFurniture.z.toFixed(2)}
                        onChange={(e) =>
                          onUpdateFurniture({
                            ...selectedFurniture,
                            z: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-transparent focus:outline-none"
                      />
                      <span className="text-neutral-500 text-[10px]">m</span>
                    </div>
                  </div>
                </div>

                {/* Elevation / Height Off Floor */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 text-amber-400" />
                      Elevation off Floor
                    </span>
                    <span className="font-mono text-neutral-300">
                      {selectedFurniture.y.toFixed(2)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={roomSettings.height - 0.2}
                    step="0.05"
                    value={selectedFurniture.y}
                    onChange={(e) =>
                      onUpdateFurniture({
                        ...selectedFurniture,
                        y: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-end gap-1 mt-1.5">
                    <button
                      onClick={() => onUpdateFurniture({ ...selectedFurniture, y: 0 })}
                      className="text-[10px] text-neutral-400 hover:text-neutral-200 underline"
                    >
                      Snap to Floor (0m)
                    </button>
                  </div>
                </div>

                {/* Rotation Angle */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-amber-400" />
                      Rotation Angle
                    </span>
                    <span className="font-mono text-neutral-300">
                      {selectedFurniture.rotation}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={selectedFurniture.rotation}
                    onChange={(e) =>
                      onUpdateFurniture({
                        ...selectedFurniture,
                        rotation: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-1 mt-2">
                    {[0, 45, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() =>
                          onUpdateFurniture({
                            ...selectedFurniture,
                            rotation: deg,
                          })
                        }
                        className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                          selectedFurniture.rotation === deg
                            ? 'bg-amber-500 text-neutral-950 font-bold'
                            : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Material & Color Finishes */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  Color & Finish
                </h3>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedFurniture.color}
                    onChange={(e) =>
                      onUpdateFurniture({
                        ...selectedFurniture,
                        color: e.target.value,
                      })
                    }
                    className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-700 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="text-neutral-400 block text-[10px]">HEX COLOR</span>
                    <span className="font-mono text-neutral-200 uppercase">
                      {selectedFurniture.color}
                    </span>
                  </div>
                </div>

                {/* Swatches */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    '#475569',
                    '#CBD5E1',
                    '#1E293B',
                    '#78350F',
                    '#D97706',
                    '#065F46',
                    '#991B1B',
                    '#F8FAFC',
                    '#18181B',
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        onUpdateFurniture({
                          ...selectedFurniture,
                          color,
                        })
                      }
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-md border cursor-pointer transition-transform hover:scale-110 ${
                        selectedFurniture.color === color
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : 'border-neutral-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Fixture Real-time Light Controls (If Light Source) */}
              {selectedFurniture.isLightSource && selectedFurniture.lightConfig && (
                <div className="space-y-3 pt-3 border-t border-neutral-800 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Fixture Lighting
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFurniture.lightEnabled !== false}
                        onChange={(e) =>
                          onUpdateFurniture({
                            ...selectedFurniture,
                            lightEnabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {selectedFurniture.lightEnabled !== false && (
                    <>
                      {/* Light Intensity Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-400">Brightness / Lumens</span>
                          <span className="font-mono text-neutral-300">
                            {selectedFurniture.lightConfig.intensity.toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="8.0"
                          step="0.2"
                          value={selectedFurniture.lightConfig.intensity}
                          onChange={(e) =>
                            onUpdateFurniture({
                              ...selectedFurniture,
                              lightConfig: {
                                ...selectedFurniture.lightConfig!,
                                intensity: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Light Color & Temperature */}
                      <div>
                        <span className="text-neutral-400 block text-xs mb-1.5">
                          Light Color / Kelvin Mood
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedFurniture.lightConfig.color}
                            onChange={(e) =>
                              onUpdateFurniture({
                                ...selectedFurniture,
                                lightConfig: {
                                  ...selectedFurniture.lightConfig!,
                                  color: e.target.value,
                                },
                              })
                            }
                            className="w-8 h-8 rounded bg-neutral-950 border border-neutral-700 cursor-pointer"
                          />
                          <div className="flex items-center gap-1">
                            {[
                              { label: 'Candle', color: '#FFAE52' },
                              { label: 'Warm', color: '#FFE8B5' },
                              { label: 'Neutral', color: '#FFF4E0' },
                              { label: 'Daylight', color: '#F0F9FF' },
                              { label: 'Amber', color: '#F59E0B' },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                onClick={() =>
                                  onUpdateFurniture({
                                    ...selectedFurniture,
                                    lightConfig: {
                                      ...selectedFurniture.lightConfig!,
                                      color: preset.color,
                                    },
                                  })
                                }
                                title={preset.label}
                                style={{ backgroundColor: preset.color }}
                                className="w-5 h-5 rounded-full border border-neutral-700 hover:scale-110 transition-transform"
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Cast Shadows toggle */}
                      <label className="flex items-center justify-between text-xs text-neutral-300 pt-1 cursor-pointer">
                        <span>Cast Soft Shadows</span>
                        <input
                          type="checkbox"
                          checked={selectedFurniture.lightConfig.castShadow}
                          onChange={(e) =>
                            onUpdateFurniture({
                              ...selectedFurniture,
                              lightConfig: {
                                ...selectedFurniture.lightConfig!,
                                castShadow: e.target.checked,
                              },
                            })
                          }
                          className="accent-amber-500 rounded"
                        />
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ============================================================ */
            /* CASE B: ROOM & LIGHTING STUDIO CONFIGURATOR */
            /* ============================================================ */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Tabs Bar */}
              <div className="grid grid-cols-2 p-1 m-3 bg-neutral-950 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setActiveTab('lighting')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'lighting'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <SunMedium className="w-3.5 h-3.5" />
                  Lighting Studio
                </button>
                <button
                  onClick={() => setActiveTab('room')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'room'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  Room Shell
                </button>
              </div>

              {/* Tab 1: Lighting Studio */}
              {activeTab === 'lighting' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {/* Presets Grid */}
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Atmosphere Presets
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {LIGHTING_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => onUpdateLighting(preset.config)}
                          className={`p-2 rounded-lg text-left border transition-all text-xs ${
                            lighting.presetName === preset.name
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <span className="font-semibold block truncate">{preset.name}</span>
                          <span className="text-[10px] text-neutral-500 block truncate mt-0.5">
                            {formatTime(preset.config.timeOfDay)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Day-Night Cycle / Time of Day */}
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Time of Day
                      </span>
                      <span className="font-mono text-amber-400 text-xs">
                        {formatTime(lighting.timeOfDay)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="5"
                      max="24"
                      step="0.25"
                      value={lighting.timeOfDay}
                      onChange={(e) => {
                        const t = parseFloat(e.target.value);
                        // Compute sun elevation & warm colors according to hour
                        let elevation = 10;
                        let color = '#FFAE52';
                        let intensity = 2.0;

                        if (t >= 6 && t <= 12) {
                          elevation = ((t - 6) / 6) * 65 + 10;
                          color = '#FFF5EB';
                          intensity = 2.4;
                        } else if (t > 12 && t <= 18) {
                          elevation = (1 - (t - 12) / 6) * 65 + 10;
                          color = t > 16.5 ? '#FFAE52' : '#FFF5EB';
                          intensity = t > 16.5 ? 2.6 : 2.4;
                        } else {
                          elevation = 4;
                          color = '#252148';
                          intensity = 0.2;
                        }

                        onUpdateLighting({
                          ...lighting,
                          timeOfDay: t,
                          sunElevation: Math.max(2, elevation),
                          sunColor: color,
                          sunIntensity: intensity,
                          presetName: 'Custom Atmosphere',
                        });
                      }}
                      className="w-full accent-amber-500 h-2 bg-gradient-to-r from-amber-600 via-sky-400 to-indigo-950 rounded-lg cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>06:00 Dawn</span>
                      <span>12:00 Noon</span>
                      <span>18:00 Dusk</span>
                      <span>24:00 Night</span>
                    </div>
                  </div>

                  {/* Sun Angle & Sunlight Controls */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      Sunlight Parameters
                    </h3>

                    {/* Sun Azimuth (Direction) */}
                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">Sun Azimuth (Direction)</span>
                        <span className="font-mono text-neutral-300">{lighting.sunAzimuth}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="5"
                        value={lighting.sunAzimuth}
                        onChange={(e) =>
                          onUpdateLighting({
                            ...lighting,
                            sunAzimuth: parseInt(e.target.value, 10),
                            presetName: 'Custom Atmosphere',
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Sun Elevation (Height in Sky) */}
                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">Sun Elevation Angle</span>
                        <span className="font-mono text-neutral-300">{lighting.sunElevation}°</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="85"
                        step="1"
                        value={lighting.sunElevation}
                        onChange={(e) =>
                          onUpdateLighting({
                            ...lighting,
                            sunElevation: parseInt(e.target.value, 10),
                            presetName: 'Custom Atmosphere',
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Sunlight Intensity */}
                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">Sunlight Intensity</span>
                        <span className="font-mono text-neutral-300">
                          {lighting.sunIntensity.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4.0"
                        step="0.2"
                        value={lighting.sunIntensity}
                        onChange={(e) =>
                          onUpdateLighting({
                            ...lighting,
                            sunIntensity: parseFloat(e.target.value),
                            presetName: 'Custom Atmosphere',
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Ambient Sky & Shadow Toggles */}
                  <div className="space-y-3 pt-3 border-t border-neutral-800">
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
                      Render & Shadows
                    </h3>

                    <label className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-lg border border-neutral-800/80 text-xs text-neutral-200 cursor-pointer">
                      <span>Real-time Floor & Wall Shadows</span>
                      <input
                        type="checkbox"
                        checked={lighting.castShadows}
                        onChange={(e) =>
                          onUpdateLighting({
                            ...lighting,
                            castShadows: e.target.checked,
                          })
                        }
                        className="accent-amber-500 rounded"
                      />
                    </label>

                    {/* Fixture Master Switch */}
                    <label className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-lg border border-neutral-800/80 text-xs text-neutral-200 cursor-pointer">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Room Fixtures Master Power
                      </span>
                      <input
                        type="checkbox"
                        checked={lighting.fixturesMasterSwitch}
                        onChange={(e) =>
                          onUpdateLighting({
                            ...lighting,
                            fixturesMasterSwitch: e.target.checked,
                          })
                        }
                        className="accent-amber-500 rounded"
                      />
                    </label>

                    {/* Camera Tone Exposure */}
                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">Tone Mapping Exposure</span>
                        <span className="font-mono text-neutral-300">
                          {lighting.exposure.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={lighting.exposure}
                        onChange={(e) =>
                          onUpdateLighting({
                            ...lighting,
                            exposure: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Active Fixtures In Room */}
                  <div className="space-y-2 pt-3 border-t border-neutral-800">
                    <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wide block">
                      Placed Light Emitters ({lightFixturesInRoom.length})
                    </span>
                    {lightFixturesInRoom.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic">
                        No light fixtures in room. Add an Arco Lamp or Brass Pendant from the catalog!
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {lightFixturesInRoom.map((fixture) => (
                          <div
                            key={fixture.id}
                            className="flex items-center justify-between p-2 bg-neutral-950 rounded-lg border border-neutral-800/80 text-xs"
                          >
                            <span className="truncate text-neutral-300 font-medium max-w-[140px]">
                              {fixture.name}
                            </span>
                            <span className="text-[10px] font-mono text-amber-400">
                              {fixture.lightEnabled !== false ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Room Shell Architecture */}
              {activeTab === 'room' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {/* Dimensions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                        Room Dimensions
                      </span>
                      <span className="font-mono text-amber-400 text-xs">
                        {(roomSettings.width * roomSettings.length).toFixed(1)} m²
                      </span>
                    </h3>

                    {/* Width */}
                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">Room Width (X)</span>
                        <span className="font-mono text-neutral-200">
                          {roomSettings.width.toFixed(1)} m
                        </span>
                      </div>
                      <input
                        type="range"
                        min="3.5"
                        max="10.0"
                        step="0.2"
                        value={roomSettings.width}
                        onChange={(e) =>
                          onUpdateRoomSettings({
                            ...roomSettings,
                            width: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Length */}
                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">Room Length (Z)</span>
                        <span className="font-mono text-neutral-200">
                          {roomSettings.length.toFixed(1)} m
                        </span>
                      </div>
                      <input
                        type="range"
                        min="3.5"
                        max="10.0"
                        step="0.2"
                        value={roomSettings.length}
                        onChange={(e) =>
                          onUpdateRoomSettings({
                            ...roomSettings,
                            length: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Height */}
                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">Ceiling Height (Y)</span>
                        <span className="font-mono text-neutral-200">
                          {roomSettings.height.toFixed(1)} m
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2.4"
                        max="4.0"
                        step="0.1"
                        value={roomSettings.height}
                        onChange={(e) =>
                          onUpdateRoomSettings({
                            ...roomSettings,
                            height: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Floor Material Selector */}
                  <div className="space-y-2.5 pt-3 border-t border-neutral-800">
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Floor Material
                    </h3>
                    <div className="space-y-1.5">
                      {FLOOR_MATERIALS.map((mat) => (
                        <button
                          key={mat.id}
                          onClick={() =>
                            onUpdateRoomSettings({
                              ...roomSettings,
                              floorMaterial: mat.id,
                            })
                          }
                          className={`w-full p-2.5 rounded-lg text-left border transition-all text-xs ${
                            roomSettings.floorMaterial === mat.id
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <span className="font-semibold block">{mat.name}</span>
                          <span className="text-[10px] text-neutral-500 block mt-0.5">
                            {mat.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wall Texture & Color */}
                  <div className="space-y-3 pt-3 border-t border-neutral-800">
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      Wall Finish
                    </h3>

                    {/* Texture Select */}
                    <div className="space-y-1">
                      <span className="text-neutral-400 block text-[10px]">WALL TEXTURE</span>
                      <select
                        value={roomSettings.wallTexture}
                        onChange={(e) =>
                          onUpdateRoomSettings({
                            ...roomSettings,
                            wallTexture: e.target.value as WallTextureType,
                          })
                        }
                        className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                      >
                        {WALL_TEXTURES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Wall Swatches */}
                    <div>
                      <span className="text-neutral-400 block text-[10px] mb-1.5">WALL COLOR</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {WALL_PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() =>
                              onUpdateRoomSettings({
                                ...roomSettings,
                                wallColor: c,
                              })
                            }
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded-md border cursor-pointer hover:scale-110 transition-transform ${
                              roomSettings.wallColor === c
                                ? 'border-amber-400 ring-2 ring-amber-400/40'
                                : 'border-neutral-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3D Cutaway Front Wall Toggle */}
                  <div className="pt-3 border-t border-neutral-800">
                    <label className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-lg border border-neutral-800/80 text-xs text-neutral-200 cursor-pointer">
                      <span>Cutaway Front Wall (3D view)</span>
                      <input
                        type="checkbox"
                        checked={cutawayFrontWall}
                        onChange={onToggleCutaway}
                        className="accent-amber-500 rounded"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
