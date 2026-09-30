import type { PlacedFurniture, RoomLayout, RoomSettings } from '../types/room';
import { FURNITURE_CATALOG } from '../data/furnitureCatalog';

export function clampFurniture(item: PlacedFurniture, room: RoomSettings): PlacedFurniture {
  const angle = item.rotation * Math.PI / 180;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  const halfWidth = item.dimensions.width * item.scaleX / 2;
  const halfDepth = item.dimensions.depth * item.scaleZ / 2;
  const maxX = Math.max(0, room.width / 2 - cos * halfWidth - sin * halfDepth);
  const maxZ = Math.max(0, room.length / 2 - sin * halfWidth - cos * halfDepth);
  const x = Math.max(-maxX, Math.min(maxX, item.x)) || 0;
  const z = Math.max(-maxZ, Math.min(maxZ, item.z)) || 0;
  const y = Math.max(0, Math.min(Math.max(0, room.height - item.dimensions.height * item.scaleY), item.y));
  return x === item.x && y === item.y && z === item.z ? item : { ...item, x, y, z };
}

export const MAX_LAYOUT_BYTES = 2_000_000;

export function parseLayout(text: string): RoomLayout {
  if (text.length > MAX_LAYOUT_BYTES) throw new Error('Layout files must be smaller than 2 MB.');
  let input: unknown;
  try { input = JSON.parse(text); } catch { throw new Error('The file is not valid JSON.'); }
  const object = (value: unknown, label: string): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
    return value as Record<string, unknown>;
  };
  const onlyKeys = (value: Record<string, unknown>, keys: string[], label: string) => {
    if (Object.keys(value).some(key => !keys.includes(key))) throw new Error(`${label} contains unsupported fields.`);
  };
  const number = (value: unknown, label: string, min: number, max: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${label} must be a number between ${min} and ${max}.`);
  };
  const string = (value: unknown, label: string) => {
    if (typeof value !== 'string' || !value.trim() || value.length > 200) throw new Error(`${label} must be nonempty text (up to 200 characters).`);
  };
  const color = (value: unknown, label: string) => {
    if (typeof value !== 'string' || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) throw new Error(`${label} must be a hexadecimal color.`);
  };
  const boolean = (value: unknown, label: string) => {
    if (typeof value !== 'boolean') throw new Error(`${label} must be true or false.`);
  };
  const oneOf = (value: unknown, choices: readonly string[], label: string) => {
    if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`${label} is not supported.`);
  };
  const data = object(input, 'Layout');
  onlyKeys(data, ['id', 'name', 'tagline', 'roomSettings', 'lighting', 'furniture'], 'Layout');
  const room = object(data.roomSettings, 'Room settings');
  onlyKeys(room, ['width', 'length', 'height', 'wallThickness', 'windowWidth', 'windowHeight', 'wallColor', 'floorColorTint', 'ceilingColor', 'hasNorthWindow', 'hasSouthWindow', 'hasEastWindow', 'hasWestWindow', 'floorMaterial', 'wallTexture'], 'Room settings');
  for (const key of ['width', 'length']) number(room[key], key, 1, 50);
  number(room.height, 'Room height', 1, 10);
  number(room.wallThickness, 'Wall thickness', 0.01, 1);
  number(room.windowWidth, 'Window width', 0.1, 50);
  number(room.windowHeight, 'Window height', 0.1, 10);
  for (const key of ['wallColor', 'floorColorTint', 'ceilingColor']) color(room[key], key);
  for (const key of ['hasNorthWindow', 'hasSouthWindow', 'hasEastWindow', 'hasWestWindow']) boolean(room[key], key);
  oneOf(room.floorMaterial, ['oak-hardwood', 'walnut-parquet', 'chevron-wood', 'polished-concrete', 'carrara-marble', 'slate-tile', 'minimal-terrazzo'], 'Floor material');
  oneOf(room.wallTexture, ['smooth-matte', 'subtle-plaster', 'architectural-brick', 'concrete-wash', 'vertical-wood'], 'Wall texture');

  const lighting = object(data.lighting, 'Lighting');
  onlyKeys(lighting, ['presetName', 'timeOfDay', 'sunAzimuth', 'sunElevation', 'sunIntensity', 'sunKelvin', 'ambientIntensity', 'exposure', 'sunColor', 'ambientColor', 'castShadows', 'showLightHelpers', 'fixturesMasterSwitch', 'shadowSoftness'], 'Lighting');
  string(lighting.presetName, 'Lighting preset');
  for (const [key, min, max] of [
    ['timeOfDay', 0, 24], ['sunAzimuth', 0, 360], ['sunElevation', 0, 90],
    ['sunIntensity', 0, 10], ['sunKelvin', 1000, 12000], ['ambientIntensity', 0, 5], ['exposure', 0.1, 5],
  ] as const) number(lighting[key], key, min, max);
  for (const key of ['sunColor', 'ambientColor']) color(lighting[key], key);
  for (const key of ['castShadows', 'showLightHelpers', 'fixturesMasterSwitch']) boolean(lighting[key], key);
  oneOf(lighting.shadowSoftness, ['sharp', 'soft', 'ultra'], 'Shadow softness');

  if (!Array.isArray(data.furniture) || data.furniture.length > 200) throw new Error('Furniture must be a list of up to 200 objects.');
  const ids = new Set<string>();
  for (const value of data.furniture) {
    const item = object(value, 'Furniture item');
    onlyKeys(item, ['id', 'catalogId', 'name', 'category', 'materialType', 'x', 'y', 'z', 'rotation', 'scaleX', 'scaleY', 'scaleZ', 'dimensions', 'color', 'secondaryColor', 'isLightSource', 'lightEnabled', 'isCeilingMounted', 'isWallMounted', 'lightConfig'], 'Furniture item');
    string(item.id, 'Item ID');
    if (ids.has(item.id as string)) throw new Error('Furniture IDs must be unique.');
    ids.add(item.id as string);
    string(item.name, 'Item name');
    if (!FURNITURE_CATALOG.some(entry => entry.id === item.catalogId)) throw new Error('The layout contains an unknown furniture model.');
    oneOf(item.category, ['seating', 'tables', 'storage', 'beds', 'lighting', 'decor', 'plants', 'architecture'], 'Furniture category');
    oneOf(item.materialType, ['fabric', 'leather', 'wood', 'metal', 'glass', 'marble', 'matte'], 'Furniture material');
    for (const key of ['x', 'y', 'z']) number(item[key], key, -1000, 1000);
    number(item.rotation, 'Rotation', -360, 360);
    for (const key of ['scaleX', 'scaleY', 'scaleZ']) number(item[key], key, 0.01, 20);
    const dimensions = object(item.dimensions, 'Furniture dimensions');
    onlyKeys(dimensions, ['width', 'depth', 'height'], 'Furniture dimensions');
    for (const key of ['width', 'depth', 'height']) number(dimensions[key], key, 0.01, 50);
    color(item.color, 'Furniture color');
    if (item.secondaryColor !== undefined) color(item.secondaryColor, 'Secondary color');
    for (const key of ['isLightSource', 'lightEnabled', 'isCeilingMounted', 'isWallMounted']) if (item[key] !== undefined) boolean(item[key], key);
    if (item.lightConfig !== undefined) {
      const light = object(item.lightConfig, 'Light settings');
      onlyKeys(light, ['type', 'color', 'intensity', 'distance', 'decay', 'bulbOffsetY', 'castShadow', 'angle', 'penumbra', 'bulbRadius'], 'Light settings');
      oneOf(light.type, ['point', 'spot'], 'Light type');
      color(light.color, 'Light color');
      number(light.intensity, 'Light intensity', 0, 1000);
      number(light.distance, 'Light distance', 0, 1000);
      number(light.decay, 'Light decay', 0, 10);
      number(light.bulbOffsetY, 'Bulb position', -50, 50);
      boolean(light.castShadow, 'Light shadows');
      if (light.angle !== undefined) number(light.angle, 'Spot angle', 0, Math.PI / 2);
      if (light.penumbra !== undefined) number(light.penumbra, 'Spot softness', 0, 1);
      if (light.bulbRadius !== undefined) number(light.bulbRadius, 'Bulb radius', 0.001, 50);
    }
  }
  const layout = data as unknown as RoomLayout;
  return { roomSettings: layout.roomSettings, lighting: layout.lighting, furniture: layout.furniture.map(item => clampFurniture(item, layout.roomSettings)) };
}
