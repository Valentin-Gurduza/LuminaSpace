# LuminaSpace

[Română](README.md) | **English**

LuminaSpace is a web application for arranging rooms and exploring interior lighting. Configure a room, place furniture and light fixtures, and compare the result in a 2D floorplan or an interactive 3D scene.

[Open the application](https://lumina-space-eight.vercel.app/) · [GitHub repository](https://github.com/Valentin-Gurduza/LuminaSpace)

## Features

- **Views:** `3D Orbit`, `2D Floorplan`, `Walkthrough`, and `Isometric` modes.
- **Room configuration:** dimensions, wall thickness, colors, textures, flooring materials, and windows on each side.
- **Furniture catalog:** seating, tables, storage, beds, lighting, decorations, plants, and architectural elements.
- **Object editing:** add, move, rotate, scale, change colors, duplicate, and delete objects.
- **Lighting:** presets, sun direction and intensity, color temperature, ambient light, exposure, and fixture settings.
- **Planning:** grid snapping at 0.1 m, 0.25 m, or 0.5 m intervals and room dimensions in the 2D floorplan.
- **Undo/Redo:** history for furniture, room settings, and lighting; continuous edits are grouped into a single operation.
- **Templates and export:** predefined rooms, JSON import/export, and PNG export of the 2D floorplan or current 3D view.
- **Responsive interface:** sidebars on desktop and overlay panels on mobile.

The 3D scene reuses furniture geometry when position, rotation, or scale changes. Rendering updates when the scene changes and while moving in Walkthrough mode; GPU resources are released when objects are replaced or removed.

## Technology

| Technology | Purpose |
| --- | --- |
| React 19 and TypeScript | Interface, editor state, and data types |
| Vite 8 | Development server and production builds |
| Three.js | 3D scene, materials, lighting, and shadows |
| SVG | 2D floorplan, dimensions, and object manipulation |
| Tailwind CSS 4 and Lucide React | Styling and icons |
| Node.js Test Runner and Playwright | Unit tests and browser tests |

## Installation and startup

You need Git, **Node.js 22.12+**, and **Bun 1.4+**. Node.js 24 is a suitable option. For 3D visualization, use an up-to-date browser with WebGL 2 support.

The repository includes `bun.lock`; installing with Bun preserves the versions in the lockfile.

```bash
git clone https://github.com/Valentin-Gurduza/LuminaSpace.git
cd LuminaSpace
bun install --frozen-lockfile
npm run dev
```

When running on your own computer, open `http://localhost:3000` in your browser. In a cloud environment, access from your browser depends on the platform's port exposure options; you can also use the version deployed on Vercel.

### Environment variables

The current features do not require API keys or a `.env` file. The `GEMINI_API_KEY` and `APP_URL` variables in `.env.example` are not used by the current editor.

The Vite configuration optionally accepts `DISABLE_HMR=true`, which disables hot module replacement and file watching during development.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server on port 3000 |
| `npm run lint` | Checks TypeScript types without generating files |
| `npm test` | Runs unit tests and browser tests |
| `npm run build` | Generates the production build in `dist/` |
| `npm run preview` | Serves the existing build locally; requires running `npm run build` first |

### Browser tests

The tests use Chromium. If you do not already have a configured browser, install it through Playwright:

```bash
npx playwright install chromium
npm test
```

On Linux, if required system libraries are missing, use `npx playwright install --with-deps chromium`; installing them may require administrator privileges.

Tests select the browser specified by `CHROMIUM_PATH`, then `/usr/bin/chromium` if it exists, otherwise Chromium installed by Playwright. The Vite test server starts and stops automatically on port **4174**, which must be available.

The suite checks edit history, 2D export, the mobile interface, invalid imports, rotated/scaled object bounds, Walkthrough movement, and GPU resource usage.

## Usage

1. Choose a room from **Templates** or configure the room in **Inspector**.
2. Add catalog objects using **Add** or by dragging them into the scene.
3. Select an object and adjust its position, rotation, dimensions through scaling, or colors in Inspector.
4. Adjust lighting and compare the view modes.
5. Save the layout through **Templates → Export JSON**. To restore it, use **Import JSON**.
6. Use **Export Render → Download PNG** to save an image.

On mobile, the **Furniture** and **Inspector** buttons open the editing panels.

### Controls

| Action | Control |
| --- | --- |
| Select and move an object | Click/touch and drag the object in 2D or 3D Orbit mode |
| Rotate the 3D camera | Click and drag an empty area |
| Pan the 3D camera | Right-click and drag |
| Pan the 2D floorplan | Drag the background |
| Zoom | Mouse wheel |
| Rotate an object in 2D | Drag the rotation handle; `Shift` snaps to 15° increments |
| Move in Walkthrough | `W`, `A`, `S`, `D`, or arrow keys |
| Look around in Walkthrough | Click and drag |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` |
| Duplicate the selected object | `Ctrl/Cmd + D` |
| Delete the selected object | `Delete` or `Backspace` |
| Deselect | `Escape` |

Editor shortcuts are suspended while typing in a form field.

## Saving and current limitations

- The current project is held in page memory. Export JSON before closing or reloading the page; there is no autosave, user account system, or cloud storage.
- The JSON file contains `roomSettings`, `lighting`, and `furniture`. Import validates structure, numeric values, colors, catalog models, and unique IDs before replacing the current project.
- Import accepts files up to **2 MB** and up to **200 objects**. These are import limits, not a performance guarantee for every device.
- Placement accounts for object rotation and scale. If an object is larger than the room, it is centered along the axis where it does not fit; it is not automatically resized.
- 2D export fits the complete floorplan and dimension annotations, independently of view panning, with a maximum side length of **2048 px**. The background grid and light-radius guides are omitted from the image.
- 3D export captures the current perspective at the canvas resolution. Appearance and performance depend on the browser and device.
- Walkthrough uses the keyboard for movement; dedicated movement buttons for touchscreens are not yet available.

## Project structure

```text
src/
├── App.tsx                 # Editor state and interface coordination
├── components/             # 2D/3D views, panels, toolbars, and modals
├── data/                   # Furniture catalog and room/lighting presets
├── types/                  # Room, furniture, and lighting types
└── utils/                  # History, validation, export, procedural models and textures
tests/
├── editor.test.ts          # Unit tests for editor logic and resources
└── browser.test.cjs        # Interface and WebGL tests with Playwright
```

## Deployment on Vercel

The application is deployed as a static frontend. In Vercel, import the GitHub repository and check these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | `Vite` |
| Root Directory | Repository root |
| Install Command | `bun install --frozen-lockfile` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | `24.x` |
| Production Branch | `main` |

For updates, push your changes to GitHub and merge them into `main`. If Git integration and automatic deployments are enabled, Vercel creates a new production deployment. Check the result under **Deployments**; a commit kept only locally does not update the published application.
