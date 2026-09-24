import * as THREE from 'three';
import { PlacedFurniture } from '../types/room';

// Helper material factory
function createMaterial(
  color: string,
  type: 'fabric' | 'leather' | 'wood' | 'metal' | 'glass' | 'marble' | 'matte' = 'fabric',
  roughness = 0.5,
  metalness = 0.1
): THREE.Material {
  switch (type) {
    case 'metal':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.25,
        metalness: 0.85,
      });
    case 'leather':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.42,
        metalness: 0.08,
      });
    case 'wood':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.04,
      });
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.05,
        transmission: 0.9,
        transparent: true,
        opacity: 0.65,
        reflectivity: 0.9,
        metalness: 0.1,
      });
    case 'marble':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.18,
        metalness: 0.08,
      });
    case 'matte':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        metalness: 0.0,
      });
    case 'fabric':
    default:
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.02,
      });
  }
}

/**
 * Builds a procedural Three.js 3D Object3D for any catalog item
 */
export function buildFurniture3D(item: PlacedFurniture, lightsEnabled = true): THREE.Group {
  const group = new THREE.Group();
  group.name = `furniture-${item.id}`;
  group.userData = { id: item.id, item };

  const primaryMat = createMaterial(item.color, item.materialType);
  const secondaryColor = item.secondaryColor || '#1E293B';
  const secondaryMat = createMaterial(secondaryColor, 'metal');
  const woodLegMat = createMaterial('#78350F', 'wood');
  const brassMat = createMaterial('#D4AF37', 'metal', 0.2, 0.9);

  // Helper to enable shadows on all meshes
  const applyShadows = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  switch (item.catalogId) {
    // ----------------------------------------------------
    // NORDIC 3-SEATER SOFA
    // ----------------------------------------------------
    case 'sofa-nordic-3seat': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;

      // Base plinth
      const baseGeo = new THREE.BoxGeometry(w, 0.14, d * 0.92);
      const base = new THREE.Mesh(baseGeo, primaryMat);
      base.position.y = 0.22;
      group.add(base);

      // Backrest
      const backGeo = new THREE.BoxGeometry(w, h * 0.55, 0.22);
      const back = new THREE.Mesh(backGeo, primaryMat);
      back.position.set(0, 0.22 + h * 0.28, -d * 0.35);
      group.add(back);

      // Left & Right Armrests
      const armGeo = new THREE.BoxGeometry(0.18, h * 0.45, d * 0.9);
      const leftArm = new THREE.Mesh(armGeo, primaryMat);
      leftArm.position.set(-w / 2 + 0.09, 0.22 + h * 0.22, 0);
      const rightArm = new THREE.Mesh(armGeo, primaryMat);
      rightArm.position.set(w / 2 - 0.09, 0.22 + h * 0.22, 0);
      group.add(leftArm, rightArm);

      // 3 Seat Cushions
      const cushionW = (w - 0.4) / 3;
      for (let i = 0; i < 3; i++) {
        const cushionGeo = new THREE.BoxGeometry(cushionW - 0.04, 0.16, d * 0.7);
        const cushion = new THREE.Mesh(cushionGeo, primaryMat);
        cushion.position.set(-w / 2 + 0.2 + cushionW * i + cushionW / 2, 0.32, 0.06);
        group.add(cushion);

        // 3 Back Cushions
        const backCushionGeo = new THREE.BoxGeometry(cushionW - 0.04, 0.35, 0.14);
        const backCushion = new THREE.Mesh(backCushionGeo, primaryMat);
        backCushion.position.set(-w / 2 + 0.2 + cushionW * i + cushionW / 2, 0.56, -d * 0.23);
        backCushion.rotation.x = -0.1;
        group.add(backCushion);
      }

      // 4 Tapered wooden legs
      const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.18, 8);
      const legPositions = [
        [-w * 0.44, 0.09, -d * 0.38],
        [w * 0.44, 0.09, -d * 0.38],
        [-w * 0.44, 0.09, d * 0.38],
        [w * 0.44, 0.09, d * 0.38],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, woodLegMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });
      break;
    }

    // ----------------------------------------------------
    // LOFT SECTIONAL L-SHAPE
    // ----------------------------------------------------
    case 'sofa-sectional-l': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;

      // Main base
      const mainBase = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, 0.38, d * 0.5), primaryMat);
      mainBase.position.set(-w * 0.175, 0.19, 0);
      // Chaise extension
      const chaise = new THREE.Mesh(new THREE.BoxGeometry(w * 0.35, 0.38, d), primaryMat);
      chaise.position.set(w * 0.325, 0.19, 0.25 * d);

      // Backrest
      const backGeo = new THREE.BoxGeometry(w, 0.45, 0.22);
      const back = new THREE.Mesh(backGeo, primaryMat);
      back.position.set(0, 0.55, -d * 0.22);

      // Armrest
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, d * 0.5), primaryMat);
      arm.position.set(-w * 0.48, 0.45, 0);

      group.add(mainBase, chaise, back, arm);
      break;
    }

    // ----------------------------------------------------
    // MOLDED LOUNGE CHAIR
    // ----------------------------------------------------
    case 'chair-lounge-curved': {
      // Wood shell
      const seatShell = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.65), woodLegMat);
      seatShell.position.set(0, 0.34, 0);
      seatShell.rotation.x = 0.08;

      // Leather cushion
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.6), primaryMat);
      cushion.position.set(0, 0.41, 0);
      cushion.rotation.x = 0.08;

      // Angled backrest shell
      const backShell = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.55, 0.07), woodLegMat);
      backShell.position.set(0, 0.68, -0.28);
      backShell.rotation.x = -0.25;

      const backCushion = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.09), primaryMat);
      backCushion.position.set(0, 0.68, -0.25);
      backCushion.rotation.x = -0.25;

      // Pedestal base & 4-star feet
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 12), secondaryMat);
      stem.position.set(0, 0.15, 0);
      group.add(seatShell, cushion, backShell, backCushion, stem);

      // Star feet
      for (let i = 0; i < 4; i++) {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.35), secondaryMat);
        foot.position.set(0, 0.02, 0);
        foot.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
        group.add(foot);
      }
      break;
    }

    // ----------------------------------------------------
    // BOUCLE ROUND OTTOMAN
    // ----------------------------------------------------
    case 'ottoman-round': {
      const radius = item.dimensions.width / 2;
      const height = item.dimensions.height;

      // Brass plinth
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.06, 24), brassMat);
      plinth.position.y = 0.03;

      // Padded body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height - 0.06, 24), primaryMat);
      body.position.y = (height - 0.06) / 2 + 0.06;

      group.add(plinth, body);
      break;
    }

    // ----------------------------------------------------
    // FLUTED OAK COFFEE TABLE
    // ----------------------------------------------------
    case 'table-coffee-fluted': {
      const radius = item.dimensions.width / 2;
      const h = item.dimensions.height;

      // Cylindrical fluted base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, h - 0.04, 32), primaryMat);
      base.position.y = (h - 0.04) / 2;

      // Beveled top
      const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.04, 32), primaryMat);
      top.position.y = h - 0.02;

      group.add(base, top);
      break;
    }

    // ----------------------------------------------------
    // CARRARA MARBLE COFFEE TABLE
    // ----------------------------------------------------
    case 'table-coffee-marble': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;

      // Marble slab top
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), primaryMat);
      top.position.y = h - 0.02;

      // Minimal black metal perimeter frame
      const frameMat = createMaterial('#0F172A', 'metal');
      const legGeo = new THREE.BoxGeometry(0.03, h - 0.04, 0.03);
      const legCoords = [
        [-w / 2 + 0.04, (h - 0.04) / 2, -d / 2 + 0.04],
        [w / 2 - 0.04, (h - 0.04) / 2, -d / 2 + 0.04],
        [-w / 2 + 0.04, (h - 0.04) / 2, d / 2 - 0.04],
        [w / 2 - 0.04, (h - 0.04) / 2, d / 2 - 0.04],
      ];
      legCoords.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, frameMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });
      group.add(top);
      break;
    }

    // ----------------------------------------------------
    // GRAND WALNUT DINING TABLE
    // ----------------------------------------------------
    case 'table-dining-walnut': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;

      // Tabletop with bevel
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), primaryMat);
      top.position.y = h - 0.03;

      // 4 Sturdy angled tapered legs
      const legGeo = new THREE.CylinderGeometry(0.04, 0.025, h - 0.06, 12);
      const legPositions = [
        [-w * 0.42, (h - 0.06) / 2, -d * 0.38],
        [w * 0.42, (h - 0.06) / 2, -d * 0.38],
        [-w * 0.42, (h - 0.06) / 2, d * 0.38],
        [w * 0.42, (h - 0.06) / 2, d * 0.38],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, primaryMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });
      group.add(top);
      break;
    }

    // ----------------------------------------------------
    // ARCHITECT STUDIO DESK
    // ----------------------------------------------------
    case 'desk-studio-oak': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;

      // Desk surface
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), primaryMat);
      deskTop.position.y = h - 0.02;

      // Drawer box underneath
      const drawerBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, d * 0.8), primaryMat);
      drawerBox.position.set(w * 0.3, h - 0.11, 0);

      // Steel frame sled legs
      const legMat = createMaterial('#18181B', 'metal');
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, h - 0.04, d * 0.85), legMat);
      leftLeg.position.set(-w * 0.44, (h - 0.04) / 2, 0);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, h - 0.04, d * 0.85), legMat);
      rightLeg.position.set(w * 0.44, (h - 0.04) / 2, 0);

      // Minimal laptop mock on top
      const laptopMat = createMaterial('#94A3B8', 'metal');
      const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.22), laptopMat);
      laptopBase.position.set(0, h + 0.004, 0);

      const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.008), laptopMat);
      laptopScreen.position.set(0, h + 0.1, -0.1);
      laptopScreen.rotation.x = -0.25;

      group.add(deskTop, drawerBox, leftLeg, rightLeg, laptopBase, laptopScreen);
      break;
    }

    // ----------------------------------------------------
    // ARCO SCULPTURAL FLOOR LAMP (REAL LIGHT SOURCE)
    // ----------------------------------------------------
    case 'light-floor-arco': {
      // Heavy marble base block
      const marbleBase = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.2), createMaterial('#F1F5F9', 'marble'));
      marbleBase.position.set(-0.8, 0.25, 0);

      // Curved arch tube
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.8, 0.5, 0),
        new THREE.Vector3(-0.5, 2.5, 0),
        new THREE.Vector3(0.5, 2.05, 0)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.02, 8, false);
      const chromeMat = createMaterial('#E2E8F0', 'metal', 0.15, 0.95);
      const tube = new THREE.Mesh(tubeGeo, chromeMat);

      // Hemispherical metal shade
      const shadeGeo = new THREE.SphereGeometry(0.18, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const shade = new THREE.Mesh(shadeGeo, chromeMat);
      shade.position.set(0.5, 2.05, 0);
      shade.rotation.x = Math.PI; // Opening downwards

      // Glowing warm bulb
      const bulbColor = item.lightConfig?.color || '#FFE8B5';
      const bulbMat = new THREE.MeshBasicMaterial({ color: bulbColor });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), bulbMat);
      bulb.position.set(0.5, 1.98, 0);

      group.add(marbleBase, tube, shade, bulb);

      // Attached Real Three.js SpotLight
      if (item.isLightSource && lightsEnabled && item.lightEnabled !== false) {
        const spotLight = new THREE.SpotLight(
          new THREE.Color(bulbColor),
          item.lightConfig?.intensity ?? 3.5,
          item.lightConfig?.distance ?? 8.0,
          item.lightConfig?.angle ?? Math.PI / 3.5,
          item.lightConfig?.penumbra ?? 0.45,
          item.lightConfig?.decay ?? 2.0
        );
        spotLight.position.set(0.5, 1.95, 0);
        spotLight.castShadow = item.lightConfig?.castShadow ?? true;
        if (spotLight.shadow) {
          spotLight.shadow.mapSize.width = 512;
          spotLight.shadow.mapSize.height = 512;
          spotLight.shadow.bias = -0.001;
        }

        const targetObj = new THREE.Object3D();
        targetObj.position.set(0.5, 0, 0);
        group.add(targetObj);
        spotLight.target = targetObj;
        group.add(spotLight);
      }
      break;
    }

    // ----------------------------------------------------
    // NORDIC BRASS PENDANT LIGHT (CEILING MOUNTED)
    // ----------------------------------------------------
    case 'light-pendant-nordic': {
      // Suspension cord
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.8, 6),
        createMaterial('#18181B', 'metal')
      );
      cord.position.y = 0.5;

      // Brass cone shade
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.22, 24, 1, true),
        brassMat
      );
      shade.position.y = 0.1;
      shade.rotation.x = Math.PI; // open bottom

      // Warm glowing filament bulb
      const bulbColor = item.lightConfig?.color || '#FFF0D4';
      const bulbMat = new THREE.MeshBasicMaterial({ color: bulbColor });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), bulbMat);
      bulb.position.y = 0.05;

      group.add(cord, shade, bulb);

      // Attached PointLight
      if (item.isLightSource && lightsEnabled && item.lightEnabled !== false) {
        const pointLight = new THREE.PointLight(
          new THREE.Color(bulbColor),
          item.lightConfig?.intensity ?? 3.0,
          item.lightConfig?.distance ?? 7.0,
          item.lightConfig?.decay ?? 2.0
        );
        pointLight.position.set(0, 0.03, 0);
        pointLight.castShadow = item.lightConfig?.castShadow ?? true;
        if (pointLight.shadow) {
          pointLight.shadow.mapSize.width = 512;
          pointLight.shadow.mapSize.height = 512;
          pointLight.shadow.bias = -0.001;
        }
        group.add(pointLight);
      }
      break;
    }

    // ----------------------------------------------------
    // TRIPOD LINEN FLOOR LAMP
    // ----------------------------------------------------
    case 'light-floor-tripod': {
      const h = item.dimensions.height;

      // 3 Wooden legs angled to collar
      const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 1.25, 8);
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const leg = new THREE.Mesh(legGeo, woodLegMat);
        leg.position.set(Math.sin(angle) * 0.2, 0.6, Math.cos(angle) * 0.2);
        leg.rotation.z = Math.sin(angle) * 0.15;
        leg.rotation.x = Math.cos(angle) * 0.15;
        group.add(leg);
      }

      // Fabric drum shade
      const shadeMat = new THREE.MeshStandardMaterial({
        color: item.color,
        roughness: 0.9,
        metalness: 0.0,
        emissive: new THREE.Color(item.lightConfig?.color || '#FFDFBA').multiplyScalar(0.2),
      });
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.38, 24, 1, true), shadeMat);
      shade.position.y = h - 0.2;

      // Bulb inside
      const bulbColor = item.lightConfig?.color || '#FFDFBA';
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: bulbColor }));
      bulb.position.y = h - 0.2;

      group.add(shade, bulb);

      if (item.isLightSource && lightsEnabled && item.lightEnabled !== false) {
        const pLight = new THREE.PointLight(
          new THREE.Color(bulbColor),
          item.lightConfig?.intensity ?? 2.4,
          item.lightConfig?.distance ?? 6.5,
          item.lightConfig?.decay ?? 2.0
        );
        pLight.position.set(0, h - 0.2, 0);
        pLight.castShadow = true;
        if (pLight.shadow) {
          pLight.shadow.mapSize.width = 512;
          pLight.shadow.mapSize.height = 512;
        }
        group.add(pLight);
      }
      break;
    }

    // ----------------------------------------------------
    // SCULPTURAL CERAMIC TABLE LAMP
    // ----------------------------------------------------
    case 'light-table-ceramic': {
      // Ceramic base
      const baseMat = createMaterial(item.secondaryColor || '#E7E5E4', 'matte');
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.26, 24), baseMat);
      base.position.y = 0.13;

      // Conical linen shade
      const shadeMat = new THREE.MeshStandardMaterial({
        color: item.color,
        roughness: 0.9,
        emissive: new THREE.Color(item.lightConfig?.color || '#FFE2B8').multiplyScalar(0.25),
      });
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.24, 24, 1, true), shadeMat);
      shade.position.y = 0.36;

      const bulbColor = item.lightConfig?.color || '#FFE2B8';
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshBasicMaterial({ color: bulbColor }));
      bulb.position.y = 0.36;

      group.add(base, shade, bulb);

      if (item.isLightSource && lightsEnabled && item.lightEnabled !== false) {
        const pLight = new THREE.PointLight(
          new THREE.Color(bulbColor),
          item.lightConfig?.intensity ?? 1.8,
          item.lightConfig?.distance ?? 4.5,
          item.lightConfig?.decay ?? 2.0
        );
        pLight.position.set(0, 0.36, 0);
        pLight.castShadow = true;
        group.add(pLight);
      }
      break;
    }

    // ----------------------------------------------------
    // CORNER MOOD LIGHT BAR
    // ----------------------------------------------------
    case 'light-led-vertical-bar': {
      const h = item.dimensions.height;
      // Triangular / small plinth
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), secondaryMat);
      plinth.position.y = 0.02;

      // Slim vertical bar
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, 0.03), secondaryMat);
      bar.position.y = h / 2;

      // Glowing LED strip facing backwards
      const ledColor = item.lightConfig?.color || '#F59E0B';
      const ledStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.015, h - 0.1, 0.01),
        new THREE.MeshBasicMaterial({ color: ledColor })
      );
      ledStrip.position.set(0, h / 2, -0.018);

      group.add(plinth, bar, ledStrip);

      if (item.isLightSource && lightsEnabled && item.lightEnabled !== false) {
        const pLight = new THREE.PointLight(
          new THREE.Color(ledColor),
          item.lightConfig?.intensity ?? 3.0,
          item.lightConfig?.distance ?? 5.5,
          item.lightConfig?.decay ?? 1.8
        );
        pLight.position.set(0, h * 0.6, -0.08);
        pLight.castShadow = true;
        group.add(pLight);
      }
      break;
    }

    // ----------------------------------------------------
    // SLATTED MEDIA CREDENZA
    // ----------------------------------------------------
    case 'storage-credenza-slat': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;

      // Main cabinet body
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.12, d), primaryMat);
      cabinet.position.y = (h - 0.12) / 2 + 0.12;

      // Front slatted detail
      const slatMat = createMaterial('#451A03', 'wood');
      const numSlats = 24;
      const slatW = (w - 0.08) / numSlats;
      for (let s = 0; s < numSlats; s++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW * 0.6, h - 0.16, 0.02), slatMat);
        slat.position.set(-w / 2 + 0.05 + s * slatW, (h - 0.12) / 2 + 0.12, d / 2 + 0.01);
        group.add(slat);
      }

      // Minimal metal feet
      const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
      const legCoords = [
        [-w * 0.44, 0.06, -d * 0.38],
        [w * 0.44, 0.06, -d * 0.38],
        [-w * 0.44, 0.06, d * 0.38],
        [w * 0.44, 0.06, d * 0.38],
      ];
      legCoords.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, secondaryMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });
      group.add(cabinet);
      break;
    }

    // ----------------------------------------------------
    // ARCHITECT OPEN BOOKSHELF
    // ----------------------------------------------------
    case 'storage-bookshelf-open': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;

      // 4 upright slim steel bars
      const uprightGeo = new THREE.BoxGeometry(0.03, h, 0.03);
      const uprightCoords = [
        [-w / 2 + 0.02, h / 2, -d / 2 + 0.02],
        [w / 2 - 0.02, h / 2, -d / 2 + 0.02],
        [-w / 2 + 0.02, h / 2, d / 2 - 0.02],
        [w / 2 - 0.02, h / 2, d / 2 - 0.02],
      ];
      uprightCoords.forEach(([ux, uy, uz]) => {
        const up = new THREE.Mesh(uprightGeo, secondaryMat);
        up.position.set(ux, uy, uz);
        group.add(up);
      });

      // 5 horizontal wood shelves
      const numShelves = 5;
      const shelfMat = primaryMat;
      for (let s = 0; s < numShelves; s++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), shelfMat);
        const sy = (h / (numShelves - 1)) * s;
        shelf.position.y = sy;
        group.add(shelf);

        // Add decorative books on middle shelves
        if (s > 0 && s < 4) {
          const bookColors = ['#991B1B', '#1E3A8A', '#065F46', '#D97706'];
          for (let b = 0; b < 4; b++) {
            const bGeo = new THREE.BoxGeometry(0.04, 0.22, 0.16);
            const bMat = createMaterial(bookColors[b % bookColors.length], 'matte');
            const book = new THREE.Mesh(bGeo, bMat);
            book.position.set(-w * 0.35 + b * 0.045, sy + 0.12, 0);
            group.add(book);
          }
        }
      }
      break;
    }

    // ----------------------------------------------------
    // SANCTUARY PLATFORM QUEEN BED
    // ----------------------------------------------------
    case 'bed-platform-queen': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;

      // Platform wood rim
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), woodLegMat);
      frame.position.set(0, 0.11, 0);

      // Upholstered Headboard
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(w * 1.05, h, 0.18), primaryMat);
      headboard.position.set(0, h / 2, -d / 2 + 0.09);

      // Mattress
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.28, d * 0.86), createMaterial('#F8FAFC', 'fabric'));
      mattress.position.set(0, 0.36, 0.08);

      // Folded Duvet
      const duvet = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.24, d * 0.55), primaryMat);
      duvet.position.set(0, 0.42, 0.25);

      // Two pillows
      const pillowGeo = new THREE.BoxGeometry(0.65, 0.12, 0.42);
      const pillowMat = createMaterial('#FFFFFF', 'fabric');
      const p1 = new THREE.Mesh(pillowGeo, pillowMat);
      p1.position.set(-w * 0.22, 0.52, -d * 0.24);
      p1.rotation.x = -0.2;
      const p2 = new THREE.Mesh(pillowGeo, pillowMat);
      p2.position.set(w * 0.22, 0.52, -d * 0.24);
      p2.rotation.x = -0.2;

      group.add(frame, headboard, mattress, duvet, p1, p2);
      break;
    }

    // ----------------------------------------------------
    // FLOATING NIGHTSTAND
    // ----------------------------------------------------
    case 'nightstand-floating': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;

      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), primaryMat);
      body.position.y = h / 2;

      // Brass knob
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 12), brassMat);
      knob.position.set(0, h / 2, d / 2 + 0.015);
      knob.rotation.x = Math.PI / 2;

      group.add(body, knob);
      break;
    }

    // ----------------------------------------------------
    // FIDDLE LEAF FIG TREE
    // ----------------------------------------------------
    case 'plant-fiddle-leaf': {
      // Ceramic cylindrical planter
      const potMat = createMaterial(item.secondaryColor || '#F5F5F4', 'matte');
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.45, 24), potMat);
      pot.position.y = 0.225;

      // Dark potting soil
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24), createMaterial('#292524', 'matte'));
      soil.position.y = 0.42;

      // Main trunk
      const trunkMat = createMaterial('#573E26', 'wood');
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.2, 8), trunkMat);
      trunk.position.set(0, 0.95, 0);

      group.add(pot, soil, trunk);

      // Broad foliage leaves at various heights & rotations
      const leafGeo = new THREE.SphereGeometry(0.18, 12, 8);
      leafGeo.scale(1.0, 0.15, 1.6);
      const leafMat = createMaterial(item.color, 'matte');

      const leafConfigs = [
        [0.18, 0.85, 0.12, 0.3, 0.5],
        [-0.18, 1.05, -0.1, -0.2, -0.8],
        [0.2, 1.25, -0.15, 0.4, 2.2],
        [-0.15, 1.45, 0.18, -0.3, 1.4],
        [0.1, 1.65, 0.08, 0.2, 3.1],
        [-0.08, 1.75, -0.08, -0.2, -2.5],
      ];
      leafConfigs.forEach(([lx, ly, lz, rx, ry]) => {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(lx, ly, lz);
        leaf.rotation.set(rx, ry, 0.2);
        group.add(leaf);
      });
      break;
    }

    // ----------------------------------------------------
    // MODERN BERBER AREA RUG
    // ----------------------------------------------------
    case 'decor-rug-geometric': {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;

      const rugGeo = new THREE.BoxGeometry(w, 0.015, d);
      const rug = new THREE.Mesh(rugGeo, primaryMat);
      rug.position.y = 0.008;

      // Subtle border stripes
      const stripeMat = createMaterial(item.secondaryColor || '#262626', 'fabric');
      const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.016, 0.04), stripeMat);
      stripe1.position.set(0, 0.008, -d * 0.35);
      const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.016, 0.04), stripeMat);
      stripe2.position.set(0, 0.008, d * 0.35);

      group.add(rug, stripe1, stripe2);
      break;
    }

    // ----------------------------------------------------
    // OVERSIZED MINIMALIST CANVAS ART
    // ----------------------------------------------------
    case 'decor-wall-art-abstract': {
      const w = item.dimensions.width;
      const h = item.dimensions.height;

      // Wooden Frame
      const frameMat = createMaterial('#451A03', 'wood');
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), frameMat);

      // Canvas
      const canvas = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, h - 0.08, 0.042), primaryMat);

      group.add(frame, canvas);
      break;
    }

    // ----------------------------------------------------
    // FULL-HEIGHT ARCH MIRROR
    // ----------------------------------------------------
    case 'decor-arch-mirror': {
      const w = item.dimensions.width;
      const h = item.dimensions.height;

      // Brass rim
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), brassMat);
      frame.position.y = h / 2;

      // Highly reflective mirror glass
      const mirrorMat = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.02,
        metalness: 0.98,
      });
      const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, h - 0.06, 0.042), mirrorMat);
      glass.position.y = h / 2;

      group.add(frame, glass);
      break;
    }

    // ----------------------------------------------------
    // INDUSTRIAL BLACK WINDOW
    // ----------------------------------------------------
    case 'arch-window-black': {
      const w = item.dimensions.width;
      const h = item.dimensions.height;

      const frameMat = secondaryMat;
      const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameMat);

      // Mullion cross bars
      const horizBar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.082), frameMat);
      const vertBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, 0.082), frameMat);
      vertBar1.position.x = -w / 4;
      const vertBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, 0.082), frameMat);
      vertBar2.position.x = w / 4;

      // Translucent glass
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: '#E0F2FE',
        roughness: 0.05,
        transmission: 0.85,
        transparent: true,
        opacity: 0.45,
      });
      const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, h - 0.06, 0.02), glassMat);

      group.add(outerFrame, horizBar, vertBar1, vertBar2, glass);
      break;
    }

    // Default fallback cube
    default: {
      const w = item.dimensions.width;
      const d = item.dimensions.depth;
      const h = item.dimensions.height;
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), primaryMat);
      box.position.y = h / 2;
      group.add(box);
      break;
    }
  }

  applyShadows(group);

  // Position, rotation, scale
  group.position.set(item.x, item.y, item.z);
  group.rotation.y = (item.rotation * Math.PI) / 180;
  group.scale.set(item.scaleX, item.scaleY, item.scaleZ);

  return group;
}
