// Model for the power supply and drives.
//
// One module per part family, so a model can be reshaped without touching
// another. Everything it draws comes from the kit it is handed: shared
// surfaces, layout constants and the groups the part is added to.
//
// @param {object} kit Shared helpers, layout constants and scene groups.
import * as THREE from 'three';
import { getItems } from '../../../core/build.js';

export function buildPowerModel(kit, build) {
  const {
    accentOf, addBox, addCable, addGhost, addRoundedBox, BOARD_REAR_Z, BOARD_X, brandPlate,
    brandStyle, CASE_D, CASE_H, CASE_W, getItems, mat, partsGroup, rgbMaterial, tex, THREE
  } = kit;

    const psu = getItems(build, 'psu')[0];
    const storage = getItems(build, 'storage');
    const accent = accentOf(psu, 0xfbbf24);
    const design = brandStyle(psu?.brand);
    const shroudMaterial = mat(`psu-shroud:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.body,
      metalness: 0.7,
      roughness: 0.32,
    }));

    // PSU shroud: a tall solid base, the way a real case hides the power
    // supply and cables. Raised: when its lid sat at -0.30 the graphics card
    // floated over a 20 cm void of empty glass and the whole rig read bottom
    // heavy and hollow.
    const SHROUD_W = CASE_W - 0.055;
    const SHROUD_TOP = -0.15;
    const SHROUD_H = CASE_H / 2 + SHROUD_TOP - 0.02;
    const shroudTop = SHROUD_TOP;
    addRoundedBox(partsGroup, SHROUD_W, SHROUD_H, CASE_D - 0.12, 0.008, 0, shroudTop - SHROUD_H / 2, 0.01, shroudMaterial, 'y');
    addBox(partsGroup, SHROUD_W - 0.05, 0.012, CASE_D - 0.18, 0, shroudTop + 0.006, 0.01, mat('psu-brush', () => new THREE.MeshStandardMaterial({
      color: 0x3d4a60,
      metalness: 0.9,
      roughness: 0.2,
    }))).castShadow = false;
    const shroudSide = SHROUD_W / 2 + 0.002;
    addBox(partsGroup, 0.004, SHROUD_H - 0.14, CASE_D - 0.28, shroudSide, shroudTop - (SHROUD_H - 0.14) / 2 - 0.02, 0.01, mat('psu-plate', () => new THREE.MeshStandardMaterial({ color: 0x090d15, metalness: 0.55, roughness: 0.38 }))).castShadow = false;
    addBox(partsGroup, 0.004, 0.006, CASE_D - 0.31, shroudSide + 0.002, shroudTop - 0.075, 0.01, mat('psu-chrome', () => new THREE.MeshStandardMaterial({ color: 0x9fb0c8, metalness: 1, roughness: 0.16 }))).castShadow = false;
    const shroudGlow = addBox(partsGroup, SHROUD_W - 0.09, 0.005, 0.007, 0, shroudTop + 0.012, CASE_D / 2 - 0.13, rgbMaterial('standard', 0.5, accent));
    shroudGlow.castShadow = false;

    if (!psu) {
      addGhost(partsGroup, 0.42, 0.17, 0.3, BOARD_X + 0.26, shroudTop - 0.14, -0.16, accent);
    } else {
      const psuMaterial = mat(`psu-body:${design.key}`, () => new THREE.MeshStandardMaterial({
        color: design.panel,
        metalness: 0.7,
        roughness: 0.34,
      }));
      // The unit sits hidden inside the shroud, the way a real case hides the
      // PSU, so it never reads as a black box floating in the middle of the rig.
      const psuY = shroudTop - 0.085;
      addRoundedBox(partsGroup, 0.4, 0.095, 0.29, 0.008, BOARD_X + 0.26, psuY, -0.16, psuMaterial, 'z');
      // Badge plate on the shroud's side, facing the window.
      const badge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 0.045),
        new THREE.MeshStandardMaterial({
          map: tex(`badge-psu:${design.key}:${psu.id ?? psu.brand}:${accent.getHex()}`, () => brandPlate({
            brand: psu.brand,
            title: design.mark,
            sub: `${psu.specs.wattage || ''}W ${psu.specs.efficiency || ''}`.trim(),
            accent,
            design,
          })),
          roughness: 0.42,
          metalness: 0.3,
        }),
      );
      badge.rotation.y = Math.PI / 2;
      badge.position.set(shroudSide + 0.004, shroudTop - 0.075, 0.05);
      partsGroup.add(badge);
      // Modular cable sockets along the shroud edge, where they would really sit.
      for (let index = 0; index < 4; index += 1) {
        addBox(partsGroup, 0.026, 0.012, 0.016, shroudSide + 0.002, shroudTop - 0.075, -0.06 - index * 0.045, mat('psu-socket', () => new THREE.MeshStandardMaterial({ color: 0x05080d, roughness: 0.6 }))).castShadow = false;
      }
    }

    // Storage: M.2 sits on the board, 2.5" drives stand upright in the bay.
    // Lying flat on the shroud they read as two loose chips dropped inside the
    // case, so they are mounted on edge like a real drive cage.
    storage.slice(0, 2).forEach((drive, index) => {
      const color = drive.specs.interface === 'NVMe' ? accentOf(drive, 0x34d399) : accentOf(drive, 0x2a3346);
      const driveDesign = brandStyle(drive.brand);
      const driveZ = 0.26 - index * 0.19;
      // A touch larger than before: at chip size these read as two loose
      // boxes dropped on the shroud instead of the drives they are.
      const driveX = SHROUD_W / 2 - 0.12;
      // 2.5" drives the way a real bay mounts them: flat, one behind the other,
      // lying in the opening between the card and the shroud. Standing them on
      // edge pointed their front faces at the camera, which read as two black
      // boxes stuck on the graphics card.
      const driveY = shroudTop + 0.02;
      const driveMaterial = mat(`drive-body:${driveDesign.key}`, () => new THREE.MeshStandardMaterial({
        color: driveDesign.body,
        metalness: 0.74,
        roughness: 0.3,
      }));
      addRoundedBox(partsGroup, 0.13, 0.032, 0.165, 0.006, driveX + 0.04, driveY, driveZ, driveMaterial, 'z');
      // A mounting tray under each drive: lying straight on the lid they read
      // as two loose plates dropped on the power-supply cover.
      addBox(partsGroup, 0.145, 0.008, 0.18, driveX + 0.04, driveY - 0.02, driveZ, mat('drive-tray', () => new THREE.MeshStandardMaterial({
        color: 0x0c1119,
        metalness: 0.6,
        roughness: 0.4,
      }))).castShadow = false;
      for (const side of [-1, 1]) {
        addBox(partsGroup, 0.012, 0.012, 0.012, driveX + 0.04 + side * 0.05, driveY - 0.02, driveZ + 0.07, mat('drive-screw', () => new THREE.MeshStandardMaterial({
          color: 0x8c98ac,
          metalness: 0.9,
          roughness: 0.3,
        }))).castShadow = false;
      }
      // An activity light, not a lit panel: at full-face size this glowed like
      // a stray green slab lying on the power-supply cover.
      addBox(partsGroup, 0.05, 0.0035, 0.012, driveX + 0.02, driveY + 0.018, driveZ, new THREE.MeshStandardMaterial({
        color: 0x080b12,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      })).castShadow = false;
      addBox(partsGroup, 0.03, 0.02, 0.011, driveX + 0.04, driveY + 0.017, driveZ - 0.07, mat('drive-trim', () => new THREE.MeshStandardMaterial({
        color: 0x2b3444,
        metalness: 0.6,
        roughness: 0.34,
      }))).castShadow = false;
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.07, 0.02),
        new THREE.MeshStandardMaterial({
          map: tex(`plate-drive:${driveDesign.key}:${drive.id ?? drive.brand}`, () => brandPlate({
            brand: drive.brand,
            title: driveDesign.mark,
            sub: `${drive.specs.interface || ''} ${drive.specs.capacityGB || ''}GB`.trim(),
            accent: color,
            design: driveDesign,
          })),
          roughness: 0.45,
          metalness: 0.25,
        }),
      );
      label.rotation.x = -Math.PI / 2;
      label.position.set(driveX + 0.04, driveY + 0.0175, driveZ);
      partsGroup.add(label);
    });

    // Cables are routed behind the motherboard, the way a real build tucks
    // them into the gap between the board and the rear wall. Running them at
    // the board's front edge made them pass straight through the graphics
    // card body, so they showed up as pale arcs drawn across the fans.
    addCable(partsGroup, [
      [BOARD_X + 0.07, 0.21, BOARD_REAR_Z - 0.018],
      [BOARD_X + 0.09, 0.06, BOARD_REAR_Z - 0.022],
      [BOARD_X + 0.1, -0.16, BOARD_REAR_Z - 0.022],
      [BOARD_X + 0.12, shroudTop + 0.02, BOARD_REAR_Z - 0.03],
    ], 0.012, 0x111720);
    addCable(partsGroup, [
      [BOARD_X + 0.02, 0.36, BOARD_REAR_Z - 0.02],
      [BOARD_X - 0.02, 0.42, BOARD_REAR_Z - 0.026],
      [BOARD_X - 0.04, 0.28, BOARD_REAR_Z - 0.03],
      [BOARD_X - 0.03, shroudTop + 0.02, BOARD_REAR_Z - 0.03],
    ], 0.01, 0x0e131c);
  }
