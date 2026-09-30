const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright');

let browser;
let server;
let serverOutput = '';
const baseURL = 'http://127.0.0.1:4174';

before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', data => { serverOutput += data; });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(baseURL)).ok) { ready = true; break; } } catch {}
    if (server.exitCode !== null) throw new Error(serverOutput);
    await delay(100);
  }
  assert.ok(ready, `Vite did not start: ${serverOutput}`);
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
});

after(async () => { await browser?.close(); server?.kill(); });

async function openPage(t, viewport = { width: 1440, height: 1000 }) {
  const page = await browser.newPage({ viewport });
  t.after(() => page.close());
  await page.addInitScript(() => {
    window.gpuStats = { created: 0, deleted: 0, draws: 0 };
    for (const [method, counter] of [['createBuffer', 'created'], ['deleteBuffer', 'deleted'], ['drawElements', 'draws'], ['drawArrays', 'draws']]) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        window.gpuStats[counter]++;
        return original.apply(this, args);
      };
    }
  });
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '3D Orbit', exact: true }).waitFor();
  return page;
}

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(100);
}

async function exportLayout(page) {
  const heading = page.getByRole('heading', { name: 'Room Templates & Studio Layouts' });
  if (!await heading.isVisible()) await page.getByRole('button', { name: 'Templates', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const stream = await (await downloadPromise).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const layout = JSON.parse(Buffer.concat(chunks).toString());
  await heading.locator('..').locator('..').getByRole('button').click();
  return layout;
}

test('2D PNG exports the complete floorplan rather than a toolbar icon', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: '2D Floorplan', exact: true }).click();
  await page.getByRole('button', { name: 'Export Render', exact: true }).click();
  const image = page.getByAltText('Room 3D Lighting Preview');
  await image.waitFor();
  await page.waitForFunction(() => document.querySelector('img[alt="Room 3D Lighting Preview"]')?.naturalWidth > 0);
  const size = await image.evaluate(element => ({ width: element.naturalWidth, height: element.naturalHeight }));
  assert.ok(size.width > 300 && size.height > 300, JSON.stringify(size));
  const visiblePixels = await image.evaluate(element => {
    const canvas = document.createElement('canvas');
    canvas.width = element.naturalWidth;
    canvas.height = element.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(element, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 30 || pixels[i + 1] > 30 || pixels[i + 2] > 30) count++;
    return count;
  });
  assert.ok(visiblePixels > 10000, `Export should include visible walls and furniture: ${visiblePixels}`);
});

test('Undo restores rotation and Redo reapplies it without deleting the object', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  const before = await exportLayout(page);
  await page.getByRole('button', { name: '90°', exact: true }).click();
  await page.getByTitle('Undo (Ctrl+Z)').click();
  assert.deepEqual(await exportLayout(page), before);
  await page.getByTitle('Redo (Ctrl+Y)').click();
  const after = await exportLayout(page);
  assert.equal(after.furniture.length, before.furniture.length);
  assert.equal(after.furniture.at(-1).rotation, 90);
});

test('2D orientation agrees with Three.js Y rotation at 45 degrees', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  const rotation = page.locator('input[type="range"][max="360"][step="5"]');
  await rotation.fill('45');
  await rotation.blur();
  await page.getByRole('button', { name: '2D Floorplan', exact: true }).click();
  const direction = await page.locator('main svg g.cursor-move').last().evaluate(group => {
    const line = group.querySelector(':scope > line');
    const matrix = group.getScreenCTM();
    const center = new DOMPoint(0, 0).matrixTransform(matrix);
    const front = new DOMPoint((line.x1.baseVal.value + line.x2.baseVal.value) / 2, line.y1.baseVal.value).matrixTransform(matrix);
    return { x: front.x - center.x, z: front.y - center.y };
  });
  assert.ok(direction.x > 0 && direction.z > 0, JSON.stringify(direction));
});

test('2D export contains the same complete room after panning on mobile', async t => {
  const page = await openPage(t, { width: 390, height: 844 });
  await page.getByRole('button', { name: '2D Floorplan', exact: true }).click();
  async function imageData() {
    await page.getByRole('button', { name: 'Export Render', exact: true }).click();
    const image = page.getByAltText('Room 3D Lighting Preview');
    await image.waitFor();
    await page.waitForFunction(() => document.querySelector('img[alt="Room 3D Lighting Preview"]')?.naturalWidth > 0);
    const source = await image.getAttribute('src');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    return source;
  }
  const before = await imageData();
  const svg = await page.locator('main svg').first().boundingBox();
  await page.mouse.move(svg.x + 20, svg.y + 80);
  await page.mouse.down({ button: 'middle' });
  await page.mouse.move(svg.x + 140, svg.y + 160);
  await page.mouse.up({ button: 'middle' });
  assert.ok(await imageData() === before, 'Export must fit the entire room independently of viewport pan');
});

test('primary pointer can pan the 2D background', async t => {
  const page = await openPage(t, { width: 390, height: 844 });
  await page.getByRole('button', { name: '2D Floorplan', exact: true }).click();
  const room = page.locator('main svg > g').last();
  const before = await room.getAttribute('transform');
  const svg = await page.locator('main svg').first().boundingBox();
  await page.mouse.move(svg.x + 20, svg.y + 80);
  await page.mouse.down();
  await page.mouse.move(svg.x + 100, svg.y + 140);
  await page.mouse.up();
  assert.notEqual(await room.getAttribute('transform'), before);
});

test('2D drag released outside the viewport stops and can be undone once', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  const before = await exportLayout(page);
  await page.getByRole('button', { name: '2D Floorplan', exact: true }).click();
  const center = await page.locator('main svg g.cursor-move').last().evaluate(group => {
    const point = new DOMPoint(0, 0).matrixTransform(group.getScreenCTM());
    return { x: point.x, y: point.y };
  });
  const viewport = await page.locator('main').boundingBox();
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(viewport.x - 20, center.y, { steps: 8 });
  await page.mouse.up();
  const after = await exportLayout(page);
  assert.notEqual(after.furniture.at(-1).x, before.furniture.at(-1).x);
  await page.mouse.move(center.x, center.y);
  assert.deepEqual(await exportLayout(page), after);
  await page.getByTitle('Undo (Ctrl+Z)').click();
  assert.deepEqual(await exportLayout(page), before);
});

test('continuous slider keyboard edits are one Undo operation', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  const before = await exportLayout(page);
  const rotation = page.locator('input[type="range"][max="360"][step="5"]');
  await rotation.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.down('ArrowRight');
  await page.keyboard.up('ArrowRight');
  await rotation.blur();
  assert.equal(await rotation.inputValue(), '20');
  await page.getByTitle('Undo (Ctrl+Z)').click();
  assert.deepEqual(await exportLayout(page), before);
  await page.getByTitle('Undo (Ctrl+Z)').click();
  assert.equal((await exportLayout(page)).furniture.length, before.furniture.length - 1);
});

test('typing in a clicked number input produces one Undo operation', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  const before = await exportLayout(page);
  const input = page.locator('input[type="number"]').first();
  await input.click();
  await input.fill('1');
  await input.fill('1.5');
  await input.blur();
  await page.getByTitle('Undo (Ctrl+Z)').click();
  const after = await exportLayout(page);
  assert.equal(after.furniture.at(-1).x, before.furniture.at(-1).x);
  assert.equal(after.furniture.length, before.furniture.length);
});

test('dragging a slider after a focused number input keeps the edits separate', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  const input = page.locator('input[type="number"]').first();
  await input.click();
  await input.fill('1');
  const slider = page.locator('input[type="range"][max="360"][step="5"]');
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  assert.ok(Number(await slider.inputValue()) > 0);
  await page.getByTitle('Undo (Ctrl+Z)').click();
  const after = await exportLayout(page);
  assert.equal(after.furniture.at(-1).x, 1);
  assert.equal(after.furniture.at(-1).rotation, 0);
});

test('mobile keeps a usable viewport and reachable furniture controls', async t => {
  const page = await openPage(t, { width: 390, height: 844 });
  const canvas = await page.locator('canvas').boundingBox();
  assert.ok(canvas.width >= 300, `Canvas width: ${canvas.width}`);
  assert.ok(canvas.x >= 0 && canvas.x + canvas.width <= 391);
  await page.getByRole('button', { name: 'Furniture', exact: true }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  assert.ok(await page.getByTitle('Delete Item').isVisible());
});

test('incomplete JSON is rejected without replacing the current layout', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: '2D Floorplan', exact: true }).click();
  const before = await exportLayout(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: 'Templates', exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'incomplete.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ roomSettings: before.roomSettings, furniture: before.furniture })) });
  await page.waitForTimeout(200);
  assert.deepEqual(errors, []);
  assert.ok(await page.getByRole('heading', { name: 'Room Templates & Studio Layouts' }).isVisible());
  assert.deepEqual(await exportLayout(page), before);
});

test('moving furniture does not allocate replacement GPU geometry', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  await settle(page);
  const before = await page.evaluate(() => window.gpuStats.created);
  await page.locator('input[type="number"]').first().fill('1');
  await page.locator('input[type="number"]').first().blur();
  await settle(page);
  const after = await page.evaluate(() => window.gpuStats.created);
  assert.equal(after, before, `GPU buffers: ${before} → ${after}`);
});

test('repeated add and delete releases the uploaded furniture geometry', async t => {
  const page = await openPage(t);
  const add = page.getByRole('button', { name: 'Add', exact: true }).first();
  await add.click();
  await settle(page);
  await page.getByTitle('Delete Item').click();
  await settle(page);
  const before = await page.evaluate(() => window.gpuStats.created - window.gpuStats.deleted);
  for (let i = 0; i < 3; i++) {
    await add.click();
    await settle(page);
    await page.getByTitle('Delete Item').click();
    await settle(page);
  }
  const after = await page.evaluate(() => window.gpuStats.created - window.gpuStats.deleted);
  assert.equal(after, before, `Retained GPU buffers: ${before} → ${after}`);
});

test('an idle room does not continuously issue GPU draw calls', async t => {
  const page = await openPage(t);
  await settle(page);
  const before = await page.evaluate(() => window.gpuStats.draws);
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => window.gpuStats.draws);
  assert.equal(after, before, `Idle GPU draw calls: ${after - before}`);
});

test('switching from orbit to walkthrough enables keyboard movement', async t => {
  const page = await openPage(t);
  await settle(page);
  await page.getByRole('button', { name: 'Walkthrough', exact: true }).click();
  await settle(page);
  const before = await page.locator('canvas').evaluate(canvas => canvas.toDataURL());
  await page.keyboard.down('w');
  await page.waitForTimeout(300);
  await page.keyboard.up('w');
  await settle(page);
  const after = await page.locator('canvas').evaluate(canvas => canvas.toDataURL());
  assert.ok(after !== before, 'The camera must move after entering walkthrough');
});

test('inspector positions respect the rotated furniture footprint', async t => {
  const page = await openPage(t);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  await page.getByRole('button', { name: '90°', exact: true }).click();
  await page.locator('input[type="number"]').first().fill('99');
  await page.locator('input[type="number"]').first().blur();
  const layout = await exportLayout(page);
  const item = layout.furniture.at(-1);
  const expected = layout.roomSettings.width / 2 - item.dimensions.depth * item.scaleZ / 2;
  assert.ok(Math.abs(item.x - expected) < 1e-6, `Position ${item.x}, expected ${expected}`);
});
