import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ViewMode, RoomSettings, LightingEnvironment, PlacedFurniture } from '../types/room';
import { getFloorMaterial, createWallTexture } from '../utils/proceduralTextures';
import { buildFurniture3D } from '../utils/modelGenerators';

interface Viewport3DProps {
  viewMode: ViewMode;
  roomSettings: RoomSettings;
  lighting: LightingEnvironment;
  furniture: PlacedFurniture[];
  selectedFurnitureId: string | null;
  onSelectFurniture: (id: string | null) => void;
  onUpdateFurniture: (updatedItem: PlacedFurniture) => void;
  onDropNewItem?: (catalogId: string, x: number, z: number) => void;
  gridSnap: number; // 0, 0.1, 0.25, 0.5
  onScreenshotReady?: (dataUrl: string) => void;
  cutawayFrontWall?: boolean;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  viewMode,
  roomSettings,
  lighting,
  furniture,
  selectedFurnitureId,
  onSelectFurniture,
  onUpdateFurniture,
  onDropNewItem,
  gridSnap,
  cutawayFrontWall = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    sunMesh: THREE.Mesh;
    floorMesh: THREE.Mesh;
    wallsGroup: THREE.Group;
    furnitureGroup: THREE.Group;
    selectionRing: THREE.Mesh;
    gridHelper: THREE.GridHelper;
    groundPlane: THREE.Plane;
    raycaster: THREE.Raycaster;
  } | null>(null);

  // Orbit state
  const orbitRef = useRef({
    isOrbiting: false,
    isPanning: false,
    isDraggingItem: false,
    dragItemId: null as string | null,
    dragOffset: new THREE.Vector3(),
    startX: 0,
    startY: 0,
    theta: Math.PI / 4, // azimuth
    phi: Math.PI / 3.2, // polar angle
    radius: 12,
    target: new THREE.Vector3(0, 1.2, 0),
    keysPressed: {} as Record<string, boolean>,
  });

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  // ---------------------------------------------------------------
  // 1. INITIALIZE THREE.JS SCENE
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A0D14');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(9, 7.5, 9);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = lighting.exposure;

    // Directional Sunlight
    const dirLight = new THREE.DirectionalLight('#FFF5EB', lighting.sunIntensity);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    // Visible Sun Disk in sky
    const sunGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#FFF3D6' });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    // Hemisphere Ambient Light
    const hemiLight = new THREE.HemisphereLight('#E2E8F0', '#334155', lighting.ambientIntensity);
    scene.add(hemiLight);

    // Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(roomSettings.width, roomSettings.length);
    const floorMat = getFloorMaterial(roomSettings.floorMaterial, roomSettings.floorColorTint);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Grid Helper (subtle floor grid)
    const gridHelper = new THREE.GridHelper(
      Math.max(roomSettings.width, roomSettings.length) * 1.5,
      Math.round(Math.max(roomSettings.width, roomSettings.length) * 2),
      0x475569,
      0x1E293B
    );
    gridHelper.position.y = 0.002;
    scene.add(gridHelper);

    // Selection Ring / Floor Disc
    const ringGeo = new THREE.RingGeometry(0.5, 0.56, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.y = 0.015;
    selectionRing.visible = false;
    scene.add(selectionRing);

    // Walls group
    const wallsGroup = new THREE.Group();
    scene.add(wallsGroup);

    // Furniture group
    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();

    threeRef.current = {
      scene,
      renderer,
      camera,
      dirLight,
      hemiLight,
      sunMesh,
      floorMesh,
      wallsGroup,
      furnitureGroup,
      selectionRing,
      gridHelper,
      groundPlane,
      raycaster,
    };

    // Animation render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth First-person walk movement if active
      if (viewMode === 'first-person') {
        const orbit = orbitRef.current;
        const speed = 0.08;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, forward).normalize();

        if (orbit.keysPressed['KeyW'] || orbit.keysPressed['ArrowUp']) {
          camera.position.addScaledVector(forward, speed);
        }
        if (orbit.keysPressed['KeyS'] || orbit.keysPressed['ArrowDown']) {
          camera.position.addScaledVector(forward, -speed);
        }
        if (orbit.keysPressed['KeyA'] || orbit.keysPressed['ArrowLeft']) {
          camera.position.addScaledVector(right, speed);
        }
        if (orbit.keysPressed['KeyD'] || orbit.keysPressed['ArrowRight']) {
          camera.position.addScaledVector(right, -speed);
        }

        // Clamp camera position inside room bounds
        const halfW = roomSettings.width / 2 - 0.3;
        const halfL = roomSettings.length / 2 - 0.3;
        camera.position.x = Math.max(-halfW, Math.min(halfW, camera.position.x));
        camera.position.z = Math.max(-halfL, Math.min(halfL, camera.position.z));
        camera.position.y = 1.6; // Eye height
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // ---------------------------------------------------------------
  // 2. UPDATE LIGHTING & SUN POSITION
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!threeRef.current) return;
    const { scene, dirLight, hemiLight, sunMesh, renderer } = threeRef.current;

    renderer.toneMappingExposure = lighting.exposure;

    // Convert time of day (0-24) or azimuth & elevation to 3D sun coordinates
    const phi = (90 - lighting.sunElevation) * (Math.PI / 180);
    const theta = (lighting.sunAzimuth + 180) * (Math.PI / 180);
    const sunDist = 20;

    const sunX = sunDist * Math.sin(phi) * Math.sin(theta);
    const sunY = Math.max(0.2, sunDist * Math.cos(phi));
    const sunZ = sunDist * Math.sin(phi) * Math.cos(theta);

    dirLight.position.set(sunX, sunY, sunZ);
    dirLight.target.position.set(0, 0, 0);
    dirLight.target.updateMatrixWorld();
    dirLight.color.set(lighting.sunColor);
    dirLight.intensity = lighting.sunIntensity;
    dirLight.castShadow = lighting.castShadows;

    sunMesh.position.set(sunX * 1.5, sunY * 1.5, sunZ * 1.5);
    sunMesh.visible = sunY > 0.5;

    // Update ambient
    hemiLight.color.set(lighting.ambientColor);
    hemiLight.groundColor.set('#1E293B');
    hemiLight.intensity = lighting.ambientIntensity;

    // Dynamic background sky color gradient matching time of day
    if (lighting.timeOfDay >= 6 && lighting.timeOfDay < 8) {
      // Dawn
      scene.background = new THREE.Color('#3A2E39');
    } else if (lighting.timeOfDay >= 8 && lighting.timeOfDay < 17) {
      // Day
      scene.background = new THREE.Color('#141A29');
    } else if (lighting.timeOfDay >= 17 && lighting.timeOfDay < 19.5) {
      // Golden hour / Sunset
      scene.background = new THREE.Color('#2C1820');
    } else {
      // Night / Midnight
      scene.background = new THREE.Color('#07090E');
    }
  }, [lighting]);

  // ---------------------------------------------------------------
  // 3. REBUILD WALLS & ROOM SHELL
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!threeRef.current) return;
    const { wallsGroup, floorMesh, gridHelper } = threeRef.current;

    // Update floor geometry & material
    floorMesh.geometry.dispose();
    floorMesh.geometry = new THREE.PlaneGeometry(roomSettings.width, roomSettings.length);
    floorMesh.material = getFloorMaterial(roomSettings.floorMaterial, roomSettings.floorColorTint);

    // Update grid
    gridHelper.position.y = 0.002;

    // Clear old walls
    while (wallsGroup.children.length > 0) {
      const child = wallsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      wallsGroup.remove(child);
    }

    const rw = roomSettings.width;
    const rl = roomSettings.length;
    const rh = roomSettings.height;
    const wt = roomSettings.wallThickness;

    const wallTex = createWallTexture(roomSettings.wallTexture, roomSettings.wallColor);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const baseboardMat = new THREE.MeshStandardMaterial({
      color: '#E2E8F0',
      roughness: 0.4,
      metalness: 0.1,
    });

    // 1. North Wall (-Z)
    const northWallGeo = new THREE.BoxGeometry(rw, rh, wt);
    const northWall = new THREE.Mesh(northWallGeo, wallMat);
    northWall.position.set(0, rh / 2, -rl / 2 - wt / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    wallsGroup.add(northWall);

    // North Baseboard
    const northBb = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.1, 0.02), baseboardMat);
    northBb.position.set(0, 0.05, -rl / 2 + 0.01);
    wallsGroup.add(northBb);

    // 2. West Wall (-X)
    const westWallGeo = new THREE.BoxGeometry(wt, rh, rl);
    const westWall = new THREE.Mesh(westWallGeo, wallMat);
    westWall.position.set(-rw / 2 - wt / 2, rh / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    wallsGroup.add(westWall);

    // West Baseboard
    const westBb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, rl), baseboardMat);
    westBb.position.set(-rw / 2 + 0.01, 0.05, 0);
    wallsGroup.add(westBb);

    // 3. East Wall (+X)
    const eastWallGeo = new THREE.BoxGeometry(wt, rh, rl);
    const eastWall = new THREE.Mesh(eastWallGeo, wallMat);
    eastWall.position.set(rw / 2 + wt / 2, rh / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    wallsGroup.add(eastWall);

    // East Baseboard
    const eastBb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, rl), baseboardMat);
    eastBb.position.set(rw / 2 - 0.01, 0.05, 0);
    wallsGroup.add(eastBb);

    // 4. South Wall (+Z) - If cutaway is enabled in Orbit mode, render a low knee wall so users look into room effortlessly!
    const southH = cutawayFrontWall && viewMode !== 'first-person' ? 0.35 : rh;
    const southWallGeo = new THREE.BoxGeometry(rw, southH, wt);
    const southWall = new THREE.Mesh(southWallGeo, wallMat);
    southWall.position.set(0, southH / 2, rl / 2 + wt / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    wallsGroup.add(southWall);

    // Ceiling (Shown in first-person mode or when cutaway is off)
    if (viewMode === 'first-person') {
      const ceilingGeo = new THREE.PlaneGeometry(rw, rl);
      const ceilingMat = new THREE.MeshStandardMaterial({
        color: roomSettings.ceilingColor || '#FAFAF8',
        roughness: 0.9,
      });
      const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
      ceiling.position.y = rh;
      ceiling.rotation.x = Math.PI / 2;
      ceiling.receiveShadow = true;
      wallsGroup.add(ceiling);
    }
  }, [roomSettings, cutawayFrontWall, viewMode]);

  // ---------------------------------------------------------------
  // 4. REBUILD FURNITURE MESHES & LIGHTS
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!threeRef.current) return;
    const { furnitureGroup } = threeRef.current;

    // Clear existing
    while (furnitureGroup.children.length > 0) {
      furnitureGroup.remove(furnitureGroup.children[0]);
    }

    // Build each item
    furniture.forEach((item) => {
      const meshGroup = buildFurniture3D(item, lighting.fixturesMasterSwitch);
      furnitureGroup.add(meshGroup);
    });
  }, [furniture, lighting.fixturesMasterSwitch]);

  // ---------------------------------------------------------------
  // 5. UPDATE SELECTION RING
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!threeRef.current) return;
    const { selectionRing } = threeRef.current;

    if (!selectedFurnitureId) {
      selectionRing.visible = false;
      return;
    }

    const selectedItem = furniture.find((f) => f.id === selectedFurnitureId);
    if (selectedItem) {
      selectionRing.visible = true;
      selectionRing.position.set(selectedItem.x, 0.015, selectedItem.z);
      const maxDim = Math.max(selectedItem.dimensions.width, selectedItem.dimensions.depth);
      selectionRing.scale.set(maxDim * 0.7, maxDim * 0.7, 1);
    } else {
      selectionRing.visible = false;
    }
  }, [selectedFurnitureId, furniture]);

  // ---------------------------------------------------------------
  // 6. UPDATE CAMERA PRESETS ON VIEW MODE CHANGE
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!threeRef.current) return;
    const { camera } = threeRef.current;
    const orbit = orbitRef.current;

    if (viewMode === '3d-orbit') {
      orbit.theta = Math.PI / 4;
      orbit.phi = Math.PI / 3.2;
      orbit.radius = Math.max(roomSettings.width, roomSettings.length) * 1.8;
      orbit.target.set(0, 1.0, 0);
      updateCameraFromOrbit();
    } else if (viewMode === '2d-plan') {
      // Top down
      orbit.theta = 0;
      orbit.phi = 0.001;
      orbit.radius = Math.max(roomSettings.width, roomSettings.length) * 1.8;
      orbit.target.set(0, 0, 0);
      updateCameraFromOrbit();
    } else if (viewMode === 'isometric') {
      orbit.theta = Math.PI / 4;
      orbit.phi = Math.PI / 3.8;
      orbit.radius = Math.max(roomSettings.width, roomSettings.length) * 2.1;
      orbit.target.set(0, 0.8, 0);
      updateCameraFromOrbit();
    } else if (viewMode === 'first-person') {
      // Placed inside room
      camera.position.set(0, 1.6, roomSettings.length * 0.3);
      camera.lookAt(0, 1.5, -roomSettings.length * 0.4);
    }
  }, [viewMode, roomSettings.width, roomSettings.length]);

  const updateCameraFromOrbit = useCallback(() => {
    if (!threeRef.current) return;
    const { camera } = threeRef.current;
    const orbit = orbitRef.current;

    const x = orbit.target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
    const y = orbit.target.y + orbit.radius * Math.cos(orbit.phi);
    const z = orbit.target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta);

    camera.position.set(x, y, z);
    camera.lookAt(orbit.target);
  }, []);

  // ---------------------------------------------------------------
  // 7. MOUSE & DRAG INTERACTION HANDLERS
  // ---------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!threeRef.current || !containerRef.current) return;
    const orbit = orbitRef.current;
    orbit.startX = e.clientX;
    orbit.startY = e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const { raycaster, camera, furnitureGroup, groundPlane } = threeRef.current;
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    // Left click checks for furniture hit
    if (e.button === 0) {
      const intersects = raycaster.intersectObjects(furnitureGroup.children, true);
      if (intersects.length > 0) {
        // Find top-level furniture group
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && (!hitObj.userData || !hitObj.userData.id)) {
          hitObj = hitObj.parent;
        }

        if (hitObj && hitObj.userData?.id) {
          const hitId = hitObj.userData.id;
          onSelectFurniture(hitId);
          orbit.isDraggingItem = true;
          orbit.dragItemId = hitId;

          // Calculate ground intersection for offset
          const planeIntersect = new THREE.Vector3();
          raycaster.ray.intersectPlane(groundPlane, planeIntersect);
          const currentItem = furniture.find((f) => f.id === hitId);
          if (currentItem) {
            orbit.dragOffset.set(
              currentItem.x - planeIntersect.x,
              0,
              currentItem.z - planeIntersect.z
            );
          }
          return;
        }
      } else {
        // Clicked empty ground
        onSelectFurniture(null);
      }

      // If no furniture clicked, start orbiting
      orbit.isOrbiting = true;
    } else if (e.button === 2) {
      // Right click: Pan
      orbit.isPanning = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!threeRef.current || !containerRef.current) return;
    const orbit = orbitRef.current;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const { raycaster, camera, groundPlane } = threeRef.current;

    // Handle dragging an existing furniture item across the floor
    if (orbit.isDraggingItem && orbit.dragItemId) {
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const planeIntersect = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, planeIntersect)) {
        let rawX = planeIntersect.x + orbit.dragOffset.x;
        let rawZ = planeIntersect.z + orbit.dragOffset.z;

        // Apply grid snap if active
        if (gridSnap > 0) {
          rawX = Math.round(rawX / gridSnap) * gridSnap;
          rawZ = Math.round(rawZ / gridSnap) * gridSnap;
        }

        // Clamp inside room boundary
        const halfW = roomSettings.width / 2 - 0.3;
        const halfL = roomSettings.length / 2 - 0.3;
        const clampedX = Math.max(-halfW, Math.min(halfW, rawX));
        const clampedZ = Math.max(-halfL, Math.min(halfL, rawZ));

        const targetItem = furniture.find((f) => f.id === orbit.dragItemId);
        if (targetItem && (targetItem.x !== clampedX || targetItem.z !== clampedZ)) {
          onUpdateFurniture({
            ...targetItem,
            x: clampedX,
            z: clampedZ,
          });
        }
      }
      return;
    }

    // Handle Camera Orbit
    if (orbit.isOrbiting && viewMode !== 'first-person') {
      const deltaX = e.clientX - orbit.startX;
      const deltaY = e.clientY - orbit.startY;
      orbit.startX = e.clientX;
      orbit.startY = e.clientY;

      orbit.theta -= deltaX * 0.007;
      orbit.phi -= deltaY * 0.007;

      // Restrict phi so camera doesn't flip or dip below floor
      orbit.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, orbit.phi));
      updateCameraFromOrbit();
      return;
    }

    // Handle Camera Pan
    if (orbit.isPanning && viewMode !== 'first-person') {
      const deltaX = e.clientX - orbit.startX;
      const deltaY = e.clientY - orbit.startY;
      orbit.startX = e.clientX;
      orbit.startY = e.clientY;

      const factor = orbit.radius * 0.0015;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize();

      orbit.target.addScaledVector(right, deltaX * factor);
      orbit.target.addScaledVector(camera.up, deltaY * factor);
      updateCameraFromOrbit();
      return;
    }

    // First person mouse look
    if (viewMode === 'first-person' && orbit.isOrbiting) {
      const deltaX = e.clientX - orbit.startX;
      const deltaY = e.clientY - orbit.startY;
      orbit.startX = e.clientX;
      orbit.startY = e.clientY;

      camera.rotation.y -= deltaX * 0.003;
      camera.rotation.x -= deltaY * 0.003;
      camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camera.rotation.x));
    }
  };

  const handlePointerUp = () => {
    const orbit = orbitRef.current;
    orbit.isOrbiting = false;
    orbit.isPanning = false;
    orbit.isDraggingItem = false;
    orbit.dragItemId = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (viewMode === 'first-person') return;
    const orbit = orbitRef.current;
    const zoomFactor = 1 + e.deltaY * 0.001;
    orbit.radius = Math.max(3, Math.min(30, orbit.radius * zoomFactor));
    updateCameraFromOrbit();
  };

  // Keyboard navigation for first-person mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      orbitRef.current.keysPressed[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      orbitRef.current.keysPressed[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ---------------------------------------------------------------
  // 8. DROP NEW ITEM FROM CATALOG ONTO CANVAS
  // ---------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOverCanvas(true);
  };

  const handleDragLeave = () => {
    setIsDragOverCanvas(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    if (!threeRef.current || !containerRef.current || !onDropNewItem) return;

    const catalogId = e.dataTransfer.getData('application/luminaspace-catalog-id');
    if (!catalogId) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const { raycaster, camera, groundPlane } = threeRef.current;
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const planeIntersect = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, planeIntersect)) {
      let dropX = planeIntersect.x;
      let dropZ = planeIntersect.z;

      if (gridSnap > 0) {
        dropX = Math.round(dropX / gridSnap) * gridSnap;
        dropZ = Math.round(dropZ / gridSnap) * gridSnap;
      }

      const halfW = roomSettings.width / 2 - 0.4;
      const halfL = roomSettings.length / 2 - 0.4;
      const clampedX = Math.max(-halfW, Math.min(halfW, dropX));
      const clampedZ = Math.max(-halfL, Math.min(halfL, dropZ));

      onDropNewItem(catalogId, clampedX, clampedZ);
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="block w-full h-full"
      />

      {/* Drag Over Overlay indicator */}
      {isDragOverCanvas && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/80 bg-amber-500/10 flex items-center justify-center transition-all">
          <div className="bg-neutral-900/90 text-amber-300 px-4 py-2 rounded-lg text-xs font-semibold backdrop-blur-md shadow-2xl border border-amber-500/30">
            Release to Place Furniture
          </div>
        </div>
      )}
    </div>
  );
};
