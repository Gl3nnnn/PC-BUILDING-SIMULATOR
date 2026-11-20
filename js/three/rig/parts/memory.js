// Model for the memory kit.
//
// One module per part family, so a model can be reshaped without touching
// another. Everything it draws comes from the kit it is handed: shared
// surfaces, layout constants and the groups the part is added to.
//
// @param {object} kit Shared helpers, layout constants and scene groups.
import * as THREE from 'three';
import { getItems } from '../../../core/build.js';

// Tiny helper so the texture cache key stays readable.
function trims0(kits, index) {
  const kit = kits[Math.min(index, kits.length - 1)];
  return kit?.id || index;
}

export function buildMemoryModel(kit, build) {
  const {
    accentOf, addBox, addGhost, addInstances, addRoundedBox, BOARD_X, brandPlate, brandStyle,
    DIMM_PITCH, DIMM_Z0, getItems, mat, memoryStyle, partsGroup, rgbMaterial, tex, THREE
  } = kit;

    const kits = getItems(build, 'ram');
    const accent = accentOf(kits[0], 0xf472b6);
    const design = brandStyle(kits[0]?.brand);
    const trim = memoryStyle(kits[0]);
    const modules = kits.length
      ? Math.min(4, kits.reduce((sum, kit) => sum + (Number(kit.specs.modules) || 0), 0))
      : 0;
    const hasRgb = kits.some((kit) => kit.specs.rgb);
    const count = modules || 2;
    const stickMaterial = mat('ram-stick', () => new THREE.MeshStandardMaterial({
      color: 0x1d2735,
      metalness: 0.62,
      roughness: 0.34,
    }));
    // Vengeance LPX is a flat matte plate, Trident Z5 is brushed aluminium with
    // a finned crown, Fury Beast is a black slab with an accent slash: three
    // different kits, three different materials.
    const heatspreaderMaterial = mat(`ram-heat:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.body,
      metalness: trim.top === 'fin' ? 0.95 : 0.8,
      roughness: trim.top === 'fin' ? 0.18 : 0.3,
    }));
    // Crown plate is the brand accent mixed well down into a dark metal. At full
    // accent strength the two sticks read as hot pink glowing slabs from above
    // instead of the dark heatspreader tops a real kit has.
    const crownMaterial = mat(`ram-crown:${design.key}:${accent.getHex()}`, () => new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent).multiplyScalar(0.18),
      metalness: 0.6,
      roughness: 0.38,
    }));
    const darkTrim = mat('ram-trim', () => new THREE.MeshStandardMaterial({ color: 0x0a0f16, roughness: 0.5, metalness: 0.4 }));

    for (let index = 0; index < count; index += 1) {
      const z = DIMM_Z0 + index * DIMM_PITCH;
      // It stands UP out of the socket: 20 cm tall, 7 cm across, and its lower
      // edge sits inside the rail's 14-24 cm band, so it is plugged in rather
      // than floating. Before, it was 32 cm tall and 1 cm thin and rose past
      // the board's top edge, which is why it read as a pole lying on the board.
      const stickY = 0.27;
      const stickH = 0.24;
      // Narrower than the slot pitch, so two sticks read as two separate
      // modules with a gap between them instead of one wide pink block.
      const stickZ = 0.03;
      if (!modules) {
        addGhost(partsGroup, 0.03, stickH, stickZ, BOARD_X + 0.034, stickY, z, accent);
        continue;
      }
      // Thin through the glass, wide along the board, 20 cm tall: the face you
      // see through the window is the tall plate with the brand print on it.
      addBox(partsGroup, 0.028, stickH, stickZ, BOARD_X + 0.028, stickY, z, stickMaterial);
      addRoundedBox(partsGroup, 0.032, stickH, 0.034, 0.004, BOARD_X + 0.034, stickY, z, heatspreaderMaterial, 'x');

      const topMaterial = hasRgb
        ? rgbMaterial('standard', 0.22, accent)
        : new THREE.MeshStandardMaterial({ color: 0x05070b, emissive: new THREE.Color(accent).multiplyScalar(0.45), emissiveIntensity: 0.4, roughness: 0.32 });
      const crownY = stickY + stickH / 2;
      // A thin lit diffuser band across the TOP edge of the plate, the way a
      // real RGB kit glows through the window. It used to be a vertical bar
      // 13 cm tall down the face at full strength, which read as a hot pink
      // slab standing in front of the stick instead of a light strip.
      const diffuserMaterial = hasRgb
        ? rgbMaterial('standard', 0.3, accent)
        : new THREE.MeshStandardMaterial({
          color: 0x080b11,
          emissive: new THREE.Color(accent).multiplyScalar(0.5),
          emissiveIntensity: 0.35,
          roughness: 0.3,
        });
      addBox(partsGroup, 0.005, 0.016, 0.03, BOARD_X + 0.051, crownY - 0.012, z, diffuserMaterial).castShadow = false;

      if (trim.top === 'fin') {
        // Trident Z: a comb of little fins across the top of the spreader.
        const teeth = [];
        for (let tooth = 0; tooth < 7; tooth += 1) teeth.push([BOARD_X + 0.034, crownY + 0.008, z - 0.012 + tooth * 0.004]);
        addInstances(partsGroup, new THREE.BoxGeometry(0.032, 0.014, 0.0016), crownMaterial, teeth);
        addRoundedBox(partsGroup, 0.032, 0.008, 0.032, 0.003, BOARD_X + 0.034, crownY + 0.002, z, topMaterial, 'y').castShadow = false;
      } else if (trim.top === 'low') {
        // LPX: nothing on top but a thin dark cap.
        addBox(partsGroup, 0.032, 0.004, 0.032, BOARD_X + 0.034, crownY + 0.002, z, darkTrim).castShadow = false;
      } else if (trim.top === 'angular') {
        // Vengeance: a raised light bar with an angled end cap.
        addRoundedBox(partsGroup, 0.032, 0.011, 0.032, 0.004, BOARD_X + 0.034, crownY + 0.005, z, topMaterial, 'y').castShadow = false;
        addRoundedBox(partsGroup, 0.034, 0.008, 0.026, 0.003, BOARD_X + 0.034, crownY + 0.012, z, crownMaterial, 'y').castShadow = false;
      } else if (trim.top === 'beast') {
        // Fury Beast: a slash of brand colour cut across the plate.
        addRoundedBox(partsGroup, 0.032, 0.012, 0.032, 0.004, BOARD_X + 0.034, crownY + 0.005, z, topMaterial, 'y').castShadow = false;
        addBox(partsGroup, 0.005, 0.006, 0.03, BOARD_X + 0.051, stickY + 0.04, z, crownMaterial).castShadow = false;
      } else if (trim.top === 'rgb') {
        addRoundedBox(partsGroup, 0.032, 0.014, 0.032, 0.005, BOARD_X + 0.034, crownY + 0.006, z, topMaterial, 'y').castShadow = false;
      } else {
        addRoundedBox(partsGroup, 0.032, 0.012, 0.032, 0.004, BOARD_X + 0.034, crownY + 0.004, z, topMaterial, 'y').castShadow = false;
      }
      // Printed label on each stick, in the maker's own wordmark style.
      const ramTex = tex(`plate-ram:${design.key}:${trims0(kits, index)}:${accent.getHex()}`, () => brandPlate({
        brand: kits[0]?.brand,
        title: (design.mark || 'RAM').toUpperCase(),
        sub: `DDR${kits[0]?.specs?.type || '4'} ${kits[0]?.specs?.speed || ''}`.trim(),
        accent,
        design,
        direction: 'tall',
      }));
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.026, 0.11),
        new THREE.MeshStandardMaterial({
          // Tinted down: the plate texture carries a bright sheen, which at
          // full strength washed each stick out to a pale pink sheet.
          color: 0x7d8798,
          map: ramTex,
          emissive: 0xffffff,
          emissiveMap: ramTex,
          emissiveIntensity: 0.45,
          roughness: 0.45,
          metalness: 0.2,
        }),
      );
      label.rotation.y = Math.PI / 2;
      label.position.set(BOARD_X + 0.0505, stickY - 0.028, z);
      label.castShadow = false;
      partsGroup.add(label);
    }
  }
