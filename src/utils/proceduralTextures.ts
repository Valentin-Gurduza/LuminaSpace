import * as THREE from 'three';
import { FloorMaterialType, WallTextureType } from '../types/room';

// Texture cache so we don't recreate canvases repeatedly
const textureCache = new Map<string, THREE.CanvasTexture>();

export function clearTextureCache(): void {
  for (const texture of textureCache.values()) texture.dispose();
  textureCache.clear();
}

/**
 * Procedural Oak Wood Plank Texture
 */
export function createWoodTexture(tint: string = '#D4A373', isParquet = false): THREE.CanvasTexture {
  const cacheKey = `wood-${tint}-${isParquet}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankHeight = isParquet ? 64 : 42;
  const numPlanks = 512 / plankHeight;

  for (let i = 0; i < numPlanks; i++) {
    const y = i * plankHeight;
    const toneVariation = (Math.random() - 0.5) * 24;

    ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.08})`;
    ctx.fillRect(0, y, 512, plankHeight);

    // Subtle grain lines
    ctx.lineWidth = 1;
    for (let g = 0; g < 14; g++) {
      const gy = y + Math.random() * plankHeight;
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.04 + Math.random() * 0.06})`;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(170, gy + (Math.random() - 0.5) * 8, 340, gy + (Math.random() - 0.5) * 8, 512, gy);
      ctx.stroke();
    }

    // Groove line between planks
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Staggered end joints
    const jointX1 = ((i * 170) % 512) + (i % 2 === 0 ? 0 : 80);
    ctx.beginPath();
    ctx.moveTo(jointX1, y);
    ctx.lineTo(jointX1, y + plankHeight);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural Marble Texture (Carrara veins)
 */
export function createMarbleTexture(): THREE.CanvasTexture {
  const cacheKey = 'marble-carrara';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 512, 512);

  // Soft clouds
  for (let c = 0; c < 20; c++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const rad = 60 + Math.random() * 120;
    const grad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rad);
    grad.addColorStop(0, 'rgba(226, 232, 240, 0.4)');
    grad.addColorStop(1, 'rgba(248, 250, 252, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dramatic gray and warm veins
  const drawVein = (color: string, width: number, count: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (let v = 0; v < count; v++) {
      ctx.beginPath();
      let cx = Math.random() * 512;
      let cy = 0;
      ctx.moveTo(cx, cy);
      while (cy < 512) {
        cx += (Math.random() - 0.45) * 45;
        cy += 20 + Math.random() * 30;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  };

  drawVein('rgba(148, 163, 184, 0.35)', 2.5, 4);
  drawVein('rgba(100, 116, 139, 0.25)', 1.5, 6);
  drawVein('rgba(180, 83, 9, 0.12)', 1.0, 3); // subtle gold vein

  // Tile joints
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.strokeRect(256, 0, 256, 256);
  ctx.strokeRect(0, 256, 256, 256);
  ctx.strokeRect(256, 256, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural Polished Concrete Texture
 */
export function createConcreteTexture(tint: string = '#94A3B8'): THREE.CanvasTexture {
  const cacheKey = `concrete-${tint}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 512, 512);

  // Noise specks and micro aggregate
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle trowel marks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 40;
  for (let s = 0; s < 5; s++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, 180 + Math.random() * 100, 0, Math.PI * 0.8);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural Terrazzo Texture
 */
export function createTerrazzoTexture(): THREE.CanvasTexture {
  const cacheKey = 'terrazzo';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#E5E5E5';
  ctx.fillRect(0, 0, 512, 512);

  const colors = ['#334155', '#B45309', '#064E3B', '#A8A29E', '#E2E8F0', '#1E1B4B'];

  for (let i = 0; i < 450; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 3 + Math.random() * 10;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size * (Math.random() - 0.5) * 2, y + size);
    ctx.lineTo(x + size, y + size * (Math.random() - 0.5));
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural Wall Plaster / Brick / Texture
 */
export function createWallTexture(type: WallTextureType, baseColor: string): THREE.CanvasTexture {
  const cacheKey = `wall-${type}-${baseColor}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  if (type === 'subtle-plaster' || type === 'concrete-wash') {
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 12;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (type === 'architectural-brick') {
    const brickH = 32;
    const brickW = 76;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let r = 0; r < 512 / brickH; r++) {
      const y = r * brickH;
      const offset = (r % 2) * (brickW / 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      for (let c = -1; c < 512 / brickW + 1; c++) {
        const x = c * brickW + offset;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + brickH);
        ctx.stroke();
      }
    }
  } else if (type === 'vertical-wood') {
    const slatW = 32;
    for (let x = 0; x < 512; x += slatW) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(x + 2, 0, slatW - 4, 512);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Get configured Three.js Material for a floor material type
 */
export function getFloorMaterial(type: FloorMaterialType, tint: string): THREE.Material {
  switch (type) {
    case 'oak-hardwood':
      return new THREE.MeshStandardMaterial({
        map: createWoodTexture(tint || '#D4A373', false),
        roughness: 0.38,
        metalness: 0.05,
      });
    case 'walnut-parquet':
      return new THREE.MeshStandardMaterial({
        map: createWoodTexture(tint || '#451A03', true),
        roughness: 0.35,
        metalness: 0.05,
      });
    case 'chevron-wood':
      return new THREE.MeshStandardMaterial({
        map: createWoodTexture(tint || '#B45309', true),
        roughness: 0.32,
        metalness: 0.08,
      });
    case 'carrara-marble':
      return new THREE.MeshStandardMaterial({
        map: createMarbleTexture(),
        roughness: 0.15,
        metalness: 0.1,
      });
    case 'polished-concrete':
      return new THREE.MeshStandardMaterial({
        map: createConcreteTexture(tint || '#94A3B8'),
        roughness: 0.45,
        metalness: 0.05,
      });
    case 'minimal-terrazzo':
      return new THREE.MeshStandardMaterial({
        map: createTerrazzoTexture(),
        roughness: 0.3,
        metalness: 0.05,
      });
    case 'slate-tile':
    default:
      return new THREE.MeshStandardMaterial({
        map: createConcreteTexture('#334155'),
        roughness: 0.6,
        metalness: 0.05,
      });
  }
}
