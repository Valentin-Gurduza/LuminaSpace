import * as THREE from 'three';
import type { PlacedFurniture } from '../types/room';
import { buildFurniture3D } from './modelGenerators';

export function disposeObject(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
    const light = object as THREE.Light & { shadow?: THREE.LightShadow };
    light.shadow?.dispose();
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

function shapeKey(item: PlacedFurniture): string {
  const { x, y, z, rotation, scaleX, scaleY, scaleZ, ...shape } = item;
  return JSON.stringify(shape);
}

export function syncFurniture(parent: THREE.Group, furniture: PlacedFurniture[], lightsEnabled: boolean): void {
  const existing = new Map(parent.children.map(child => [child.userData.id as string, child]));
  const ids = new Set(furniture.map(item => item.id));
  for (const child of [...parent.children]) {
    if (!ids.has(child.userData.id)) {
      parent.remove(child);
      disposeObject(child);
    }
  }
  for (const item of furniture) {
    let group = existing.get(item.id);
    if (group?.userData.item === item && (!item.isLightSource || group.userData.lightsEnabled === lightsEnabled)) continue;
    const key = shapeKey(item);
    if (!group || group.userData.shapeKey !== key || (item.isLightSource && group.userData.lightsEnabled !== lightsEnabled)) {
      if (group) { parent.remove(group); disposeObject(group); }
      group = buildFurniture3D(item, lightsEnabled);
      group.userData.shapeKey = key;
      group.userData.lightsEnabled = lightsEnabled;
      parent.add(group);
    }
    group.position.set(item.x, item.y, item.z);
    group.rotation.y = item.rotation * Math.PI / 180;
    group.scale.set(item.scaleX, item.scaleY, item.scaleZ);
    group.userData.item = item;
  }
}
