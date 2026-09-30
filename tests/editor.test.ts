import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ROOM_PRESETS } from '../src/data/roomPresets';
import { createHistory, historyReducer } from '../src/utils/history';
import { clampFurniture, parseLayout } from '../src/utils/layout';
import { disposeObject, syncFurniture } from '../src/utils/scene';

const layout = structuredClone(ROOM_PRESETS[0]);

test('history groups a gesture, keeps no-op redo and clears redo on a new edit', () => {
  let history = createHistory(layout);
  history = historyReducer(history, { type: 'begin' });
  for (const exposure of [1.2, 1.3, 1.4]) history = historyReducer(history, { type: 'update', update: current => ({ ...current, lighting: { ...current.lighting, exposure } }) });
  history = historyReducer(history, { type: 'commit' });
  assert.equal(history.past.length, 1);
  history = historyReducer(history, { type: 'undo' });
  assert.deepEqual(history.present, layout);
  history = historyReducer(history, { type: 'begin' });
  history = historyReducer(history, { type: 'commit' });
  assert.equal(history.future.length, 1);
  history = historyReducer(history, { type: 'redo' });
  assert.equal(history.present.lighting.exposure, 1.4);
  history = historyReducer(history, { type: 'undo' });
  history = historyReducer(history, { type: 'update', update: current => ({ ...current, roomSettings: { ...current.roomSettings, width: 7 } }) });
  assert.equal(history.future.length, 0);
});

test('history stores room and lighting together and bounds retained snapshots', () => {
  let history = createHistory(layout);
  for (let i = 0; i < 110; i++) history = historyReducer(history, { type: 'update', update: current => ({ ...current, lighting: { ...current.lighting, timeOfDay: i } }) });
  assert.equal(history.past.length, 100);
  assert.equal(historyReducer(history, { type: 'replace', layout }).past.length, 0);
});

test('position bounds account for rotation, scale and objects larger than the room', () => {
  const item = { ...layout.furniture[1], x: 99, z: -99, rotation: 90, scaleX: 2, scaleZ: 3 };
  const clamped = clampFurniture(item, layout.roomSettings);
  assert.ok(Math.abs(clamped.x - (layout.roomSettings.width / 2 - item.dimensions.depth * 3 / 2)) < 1e-6);
  assert.ok(Math.abs(clamped.z + Math.max(0, layout.roomSettings.length / 2 - item.dimensions.width)) < 1e-9);
  const diagonal = clampFurniture({ ...item, rotation: 45, scaleX: 1, scaleZ: 1 }, layout.roomSettings);
  const halfExtent = (item.dimensions.width + item.dimensions.depth) / (2 * Math.sqrt(2));
  assert.ok(Math.abs(diagonal.x - (layout.roomSettings.width / 2 - halfExtent)) < 1e-6);
  const oversized = clampFurniture({ ...item, scaleX: 100, scaleZ: 100 }, layout.roomSettings);
  assert.equal(oversized.x, 0);
  assert.equal(oversized.z, 0);
});

test('layout import accepts all exported presets and rejects malformed data', () => {
  for (const preset of ROOM_PRESETS) assert.equal(parseLayout(JSON.stringify(preset)).furniture.length, preset.furniture.length);
  const invalid: any[] = [null, {}, { ...layout, lighting: undefined }, { ...layout, furniture: {} }];
  for (const change of [
    (data: any) => { data.roomSettings.width = '6'; },
    (data: any) => { data.roomSettings.height = 0; },
    (data: any) => { data.lighting.exposure = Infinity; },
    (data: any) => { data.furniture[0].dimensions.width = -1; },
    (data: any) => { data.furniture[1].id = data.furniture[0].id; },
    (data: any) => { data.furniture[0].catalogId = 'unknown-model'; },
    (data: any) => { data.furniture[0].color = 'url(https://example.com)'; },
    (data: any) => { data.furniture[0].scaleX = 0; },
    (data: any) => { data.furniture[0].isLightSource = 'true'; },
  ]) { const data = structuredClone(layout); change(data); invalid.push(data); }
  for (const data of invalid) assert.throws(() => parseLayout(JSON.stringify(data)));
  assert.throws(() => parseLayout('{'));
  assert.throws(() => parseLayout(' '.repeat(2_000_001)));
});

test('layout import rejects unchecked deeply nested furniture properties', () => {
  const text = JSON.stringify(layout).replace('"furniture":[{', '"furniture":[{"extra":' + '{"next":'.repeat(10000) + 'null' + '}'.repeat(10000) + ',');
  assert.ok(text.length < 2_000_000);
  assert.throws(() => parseLayout(text), /unsupported/i);
});

test('scene reconciliation preserves meshes for transforms and unchanged items', () => {
  const group = new THREE.Group();
  const furniture = layout.furniture.slice(0, 2);
  syncFurniture(group, furniture, true);
  const original = [...group.children];
  const moved = { ...furniture[0], x: 1, rotation: 90, scaleX: 1.5 };
  syncFurniture(group, [moved, furniture[1]], true);
  assert.equal(group.children[0], original[0]);
  assert.equal(group.children[1], original[1]);
  assert.equal(group.children[0].position.x, 1);
  assert.equal(group.children[0].rotation.y, Math.PI / 2);
  syncFurniture(group, [{ ...moved, color: '#FFFFFF' }, furniture[1]], true);
  assert.notEqual(group.children.find(child => child.userData.id === moved.id), original[0]);
  assert.ok(group.children.includes(original[1]));
  disposeObject(group);
});

test('resource cleanup disposes shared geometry and material once without disposing textures', () => {
  const root = new THREE.Group();
  const texture = new THREE.Texture();
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ map: texture });
  root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
  const counts = { geometry: 0, material: 0, texture: 0 };
  geometry.addEventListener('dispose', () => counts.geometry++);
  material.addEventListener('dispose', () => counts.material++);
  texture.addEventListener('dispose', () => counts.texture++);
  disposeObject(root);
  assert.deepEqual(counts, { geometry: 1, material: 1, texture: 0 });
});
