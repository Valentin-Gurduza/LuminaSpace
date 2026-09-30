export type ViewMode = '3d-orbit' | '2d-plan' | 'first-person' | 'isometric';

export type FloorMaterialType = 'oak-hardwood' | 'walnut-parquet' | 'chevron-wood' | 'polished-concrete' | 'carrara-marble' | 'slate-tile' | 'minimal-terrazzo';

export type WallTextureType = 'smooth-matte' | 'subtle-plaster' | 'architectural-brick' | 'concrete-wash' | 'vertical-wood';

export type FurnitureCategory = 'seating' | 'tables' | 'storage' | 'beds' | 'lighting' | 'decor' | 'plants' | 'architecture';

export interface LightSourceConfig {
  type: 'point' | 'spot';
  color: string;
  intensity: number;
  distance: number;
  decay: number;
  castShadow: boolean;
  angle?: number;
  penumbra?: number;
  bulbOffsetY: number;
  bulbRadius?: number;
}

export interface CatalogItemDefinition {
  id: string;
  name: string;
  category: FurnitureCategory;
  description: string;
  dimensions: {
    width: number; // X axis in meters
    depth: number; // Z axis in meters
    height: number; // Y axis in meters
  };
  defaultColor: string;
  secondaryColor?: string;
  availableColors: string[];
  materialType: 'fabric' | 'leather' | 'wood' | 'metal' | 'glass' | 'marble' | 'matte';
  isLightSource?: boolean;
  defaultLight?: LightSourceConfig;
  isCeilingMounted?: boolean;
  isWallMounted?: boolean;
  iconName: string;
}

export interface PlacedFurniture {
  id: string;
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  x: number; // Room center is (0,0)
  z: number;
  y: number; // Elevation off floor
  rotation: number; // In degrees (0-360)
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  color: string;
  secondaryColor?: string;
  materialType: 'fabric' | 'leather' | 'wood' | 'metal' | 'glass' | 'marble' | 'matte';
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  isLightSource?: boolean;
  lightConfig?: LightSourceConfig;
  lightEnabled?: boolean;
  isCeilingMounted?: boolean;
  isWallMounted?: boolean;
}

export interface RoomSettings {
  width: number; // meters (e.g. 5.5)
  length: number; // meters (e.g. 6.5)
  height: number; // meters (e.g. 2.8)
  wallColor: string;
  wallTexture: WallTextureType;
  wallThickness: number; // meters (e.g. 0.15)
  floorMaterial: FloorMaterialType;
  floorColorTint: string;
  ceilingColor: string;
  hasNorthWindow: boolean;
  hasSouthWindow: boolean;
  hasEastWindow: boolean;
  hasWestWindow: boolean;
  windowWidth: number;
  windowHeight: number;
}

export interface LightingEnvironment {
  presetName: string;
  timeOfDay: number; // 0 to 24 hours (e.g. 15.5 = 3:30 PM)
  sunAzimuth: number; // 0 to 360 deg
  sunElevation: number; // 0 to 90 deg
  sunIntensity: number; // 0 to 3.0
  sunColor: string; // hex
  sunKelvin: number; // 2000 to 8000
  ambientIntensity: number; // 0.05 to 1.2
  ambientColor: string;
  castShadows: boolean;
  shadowSoftness: 'sharp' | 'soft' | 'ultra';
  exposure: number; // tone mapping exposure
  showLightHelpers: boolean;
  fixturesMasterSwitch: boolean;
}

export interface RoomPreset {
  id: string;
  name: string;
  tagline: string;
  roomSettings: RoomSettings;
  lighting: LightingEnvironment;
  furniture: PlacedFurniture[];
}

export interface RoomLayout {
  roomSettings: RoomSettings;
  lighting: LightingEnvironment;
  furniture: PlacedFurniture[];
}
