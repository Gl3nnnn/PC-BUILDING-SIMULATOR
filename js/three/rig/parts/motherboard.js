// Model for the motherboard.
//
// One module per part family, so a model can be reshaped without touching
// another. Everything it draws comes from the kit it is handed: shared
// surfaces, layout constants and the groups the part is added to.
//
// @param {object} kit Shared helpers, layout constants and scene groups.
import * as THREE from 'three';
import { getItems } from '../../../core/build.js';

export function buildMotherboardModel(kit, build) {
  const {
    accentOf, addBox, addInstances, addRoundedBox, addScrew, BOARD_D, BOARD_FRONT_Z, BOARD_H,
    BOARD_REAR_Z, BOARD_X, BOARD_Y, brandPlate, brandStyle, createPcbTexture, DIMM_PITCH,
    DIMM_Z0, getItems, mat, partsGroup, tex, THREE
  } = kit;

    const board = getItems(build, 'motherboard')[0];
    const accent = accentOf(board, 0x38bdf8);
    const design = brandStyle(board?.brand);
    const pcbTexture = board ? tex(`pcb:${accent.getHex()}:${design.key}`, () => createPcbTexture(accent)) : null;
    // The board sits right behind the smoked glass, so it must stay dark:
    // a bright PCB plus glass haze turned the whole side view milky blue.
    // Tinted again: at 0x9aa7b8 the board read as a pale concrete slab with
    // tiny traces on it, not a green-black circuit board.
    const pcbMaterial = new THREE.MeshStandardMaterial({
      color: 0x5f7080,
      map: pcbTexture,
      emissive: 0x03090e,
      emissiveIntensity: 0.25,
      roughness: 0.72,
      metalness: 0.18,
      envMapIntensity: 0.25,
    });
    if (!board) pcbMaterial.color.set(0x0a151d);
    const boardMesh = addBox(partsGroup, 0.016, BOARD_H, BOARD_D, BOARD_X, BOARD_Y, BOARD_REAR_Z + BOARD_D / 2, pcbMaterial);
    if (!board) {
      boardMesh.material.transparent = true;
      boardMesh.material.opacity = 0.35;
      boardMesh.material.wireframe = true;
    }

    const slotMaterial = mat('mb-slot', () => new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.44, metalness: 0.4 }));
    const heatsinkMaterial = mat(`mb-heatsink:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.body,
      metalness: Math.max(0.62, design.metalness),
      roughness: Math.min(0.3, design.roughness),
    }));
    const darkMetal = mat('mb-darkmetal', () => new THREE.MeshStandardMaterial({ color: 0x10161f, metalness: 0.7, roughness: 0.34 }));
    const trimMaterial = mat(`mb-trim:${accent.getHex()}`, () => new THREE.MeshStandardMaterial({
      color: 0x070a10,
      emissive: accent,
      // Emissive at 0.4 turned the VRM and I/O strips into two bright red
      // rectangles floating in the dark; they are accents on a heatsink, not
      // light bars.
      emissiveIntensity: 0.16,
      roughness: 0.38,
      metalness: 0.3,
    }));
    const goldMaterial = mat('mb-gold', () => new THREE.MeshStandardMaterial({ color: 0xc9a05a, metalness: 1, roughness: 0.28 }));

    // Rear I/O shroud with an etched accent and port cutouts (faces -Z).
    addRoundedBox(partsGroup, 0.03, 0.2, 0.14, 0.008, BOARD_X + 0.02, 0.33, BOARD_REAR_Z + 0.05, heatsinkMaterial, 'x');
    addBox(partsGroup, 0.008, 0.05, 0.12, BOARD_X + 0.038, 0.33, BOARD_REAR_Z + 0.05, trimMaterial).castShadow = false;
    for (let index = 0; index < 4; index += 1) {
      addBox(partsGroup, 0.024, 0.014, 0.03, BOARD_X + 0.016, 0.39 - index * 0.022, BOARD_REAR_Z + 0.004, slotMaterial).castShadow = false;
    }
    addBox(partsGroup, 0.024, 0.02, 0.032, BOARD_X + 0.016, 0.295, BOARD_REAR_Z + 0.004, slotMaterial).castShadow = false;

    // VRM heatsinks with parallel fins.
    const vrmFins = [];
    for (let index = 0; index < 9; index += 1) vrmFins.push([BOARD_X + 0.047, 0.33, BOARD_REAR_Z + 0.085 + index * 0.016]);
    addInstances(partsGroup, new THREE.BoxGeometry(0.05, 0.17, 0.007), heatsinkMaterial, vrmFins);
    addBox(partsGroup, 0.026, 0.19, 0.16, BOARD_X + 0.032, 0.33, BOARD_REAR_Z + 0.09, darkMetal);
    addBox(partsGroup, 0.006, 0.12, 0.012, BOARD_X + 0.07, 0.33, BOARD_REAR_Z + 0.09, trimMaterial).castShadow = false;

    // Chipset heatsink, low profile, with an angled accent face.
    addRoundedBox(partsGroup, 0.03, 0.1, 0.15, 0.006, BOARD_X + 0.026, -0.13, 0.055, heatsinkMaterial, 'x');
    const chipFins = [];
    for (let index = 0; index < 7; index += 1) chipFins.push([BOARD_X + 0.043, -0.13, -0.005 + index * 0.022]);
    addInstances(partsGroup, new THREE.BoxGeometry(0.006, 0.075, 0.01), darkMetal, chipFins);
    addBox(partsGroup, 0.008, 0.028, 0.1, BOARD_X + 0.044, -0.13, 0.055, trimMaterial).castShadow = false;

    // Printed plate on the chipset heatsink: the board's calling card. A printed
    // plate rather than a bare logo, so the maker and chipset both read through
    // the glass — at 0.115 by 0.052 the wordmark was unreadable.
    if (board) {
      const logo = new THREE.Mesh(
        new THREE.PlaneGeometry(0.17, 0.075),
        new THREE.MeshStandardMaterial({
          map: tex(`mb-plate:${design.key}:${board.id ?? board.brand}:${accent.getHex()}`, () => brandPlate({
            brand: board.brand,
            title: design.mark,
            sub: `${board.specs?.chipset || ''} ${board.specs?.formFactor || ''}`.trim().toUpperCase(),
            accent,
            design,
          })),
          emissive: 0xffffff,
          emissiveMap: tex(`mb-plate:${design.key}:${board.id ?? board.brand}:${accent.getHex()}`, () => brandPlate({
            brand: board.brand,
            title: design.mark,
            sub: `${board.specs?.chipset || ''} ${board.specs?.formFactor || ''}`.trim().toUpperCase(),
            accent,
            design,
          })),
          emissiveIntensity: 0.6,
          roughness: 0.4,
          metalness: 0.2,
        }),
      );
      logo.rotation.y = Math.PI / 2;
      logo.position.set(BOARD_X + 0.0465, -0.13, 0.055);
      logo.castShadow = false;
      partsGroup.add(logo);
    }

    // DIMM slots: four upright rails 4.8 cm apart, each with gold contacts at
    // the mouth and a latch clip at both ends. The first pass drew them 0.3 long
    // in z and only 0.038 apart, so all four overlapped into one bar lying
    // along the board's foot and the memory had nothing to stand in.
    // The socket is a short upright rail behind the module's lower half: the
    // stick plugs into it and stands on top of it. This is what makes the
    // memory read as seated, instead of a plate pasted flat on the board.
    const dimmBase = [];
    for (let index = 0; index < 4; index += 1) {
      const z = DIMM_Z0 + index * DIMM_PITCH;
      addBox(partsGroup, 0.04, 0.1, 0.046, BOARD_X + 0.02, 0.19, z, slotMaterial).castShadow = false;
      addBox(partsGroup, 0.01, 0.018, 0.05, BOARD_X + 0.041, 0.155, z, goldMaterial).castShadow = false;
      // Clips at both ends of the rail, the way a real DIMM slot latches a stick.
      dimmBase.push([BOARD_X + 0.02, 0.245, z - 0.022]);
      dimmBase.push([BOARD_X + 0.02, 0.245, z + 0.022]);
    }
    addInstances(partsGroup, new THREE.BoxGeometry(0.044, 0.022, 0.01), darkMetal, dimmBase);

    // PCIe x16 slot with a reinforced metal head.
    addBox(partsGroup, 0.02, 0.022, 0.31, BOARD_X + 0.014, -0.115, -0.1, slotMaterial);
    addBox(partsGroup, 0.026, 0.03, 0.05, BOARD_X + 0.016, -0.115, -0.255, heatsinkMaterial).castShadow = false;
    addBox(partsGroup, 0.026, 0.03, 0.05, BOARD_X + 0.016, -0.115, 0.052, heatsinkMaterial).castShadow = false;

    // M.2 drive bay plus its heatsink cover.
    addBox(partsGroup, 0.014, 0.012, 0.2, BOARD_X + 0.012, 0.145, -0.02, slotMaterial).castShadow = false;
    addRoundedBox(partsGroup, 0.024, 0.024, 0.22, 0.005, BOARD_X + 0.028, 0.155, -0.02, heatsinkMaterial, 'x');
    addBox(partsGroup, 0.006, 0.004, 0.14, BOARD_X + 0.041, 0.155, -0.02, trimMaterial).castShadow = false;

    // 24-pin connector and the front-panel header.
    addBox(partsGroup, 0.034, 0.1, 0.05, BOARD_X + 0.024, 0.24, BOARD_FRONT_Z - 0.06, slotMaterial);
    addBox(partsGroup, 0.034, 0.022, 0.06, BOARD_X + 0.024, -0.045, BOARD_FRONT_Z - 0.06, slotMaterial).castShadow = false;

    // Solid capacitors and a scatter of surface-mount parts.
    const capMaterial = mat('mb-cap', () => new THREE.MeshStandardMaterial({ color: 0x1b2536, metalness: 0.7, roughness: 0.32 }));
    const caps = [];
    for (let index = 0; index < 12; index += 1) {
      caps.push([BOARD_X + 0.036, -0.08 + (index % 4) * 0.05, 0.02 + Math.floor(index / 4) * 0.05]);
    }
    const capGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.042, 10);
    const capMesh = new THREE.InstancedMesh(capGeo, capMaterial, caps.length);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    const unitScale = new THREE.Vector3(1, 1, 1);
    caps.forEach((entry, index) => {
      matrix.compose(new THREE.Vector3(entry[0], entry[1], entry[2]), quaternion, unitScale);
      capMesh.setMatrixAt(index, matrix);
    });
    capMesh.instanceMatrix.needsUpdate = true;
    partsGroup.add(capMesh);

    // Debug LED block: four tiny status lights. Basic material made them glow
    // at full brightness, so from above the board carried a rainbow strip of
    // four squares that looked like a stray graphic rather than status LEDs.
    const ledColors = [0xff4d5e, 0xfbbf24, 0x6ee7b7, 0x67e8f9];
    ledColors.forEach((color, index) => {
      const led = addBox(
        partsGroup,
        0.008,
        0.004,
        0.004,
        BOARD_X + 0.012,
        0.4,
        BOARD_FRONT_Z - 0.11 + index * 0.007,
        new THREE.MeshStandardMaterial({
          color: 0x0b0f16,
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.4,
        }),
      );
      led.castShadow = false;
    });

    // Board screws.
    const screwMaterial = mat('mb-screw', () => new THREE.MeshStandardMaterial({ color: 0x8a99b2, metalness: 0.95, roughness: 0.22 }));
    for (const [sy, sz] of [[0.36, 0.06], [0.36, 0.55], [-0.26, 0.06], [-0.26, 0.55], [0.06, 0.55], [0.06, 0.06]]) {
      addScrew(partsGroup, BOARD_X + 0.02, sy, BOARD_REAR_Z + sz, 0.009, screwMaterial);
    }

    return { board, accent };
  }
