// Model for the graphics card.
//
// One module per part family, so a model can be reshaped without touching
// another. Everything it draws comes from the kit it is handed: shared
// surfaces, layout constants and the groups the part is added to.
//
// @param {object} kit Shared helpers, layout constants and scene groups.
import * as THREE from 'three';
import { getItems } from '../../../core/build.js';

export function buildGpuModel(kit, build) {
  const {
    accentOf, addBox, addCable, addCylinder, addDimensionMark, addFan, addGhost, addInstances,
    addRoundedBox, BOARD_X, brandPlate, brandStyle, CASE_D, getItems, GPU_REAR_Z, GPU_Y,
    gpuSeries, mat, measureGroup, partsGroup, rgbMaterial, tex, THREE
  } = kit;

    const gpu = getItems(build, 'gpu')[0];
    const accent = accentOf(gpu, 0xa855f7);
    const length = gpu ? Math.min(0.66, Math.max(0.38, Number(gpu.specs.length) * 0.00205)) : 0.5;
    // A real card is a fat slab that reaches most of the way to the glass. At
    // 0.22 deep it sat as a thin plank and left a wall of empty glass between
    // its fans and the window, which is what made the interior look half empty.
    const centerX = BOARD_X + 0.19;
    const centerZ = GPU_REAR_Z + length / 2;
    // Two slots tall, not four: at 0.24 with a 0.34 body the card swallowed the
    // whole lower half of the case and read as a black crate with fans on it.
    const height = 0.2;
    const depth = 0.3;

    if (!gpu) {
      addGhost(partsGroup, depth, height, length, centerX, GPU_Y, centerZ, accent);
      return;
    }

    const design = brandStyle(gpu.brand);
    const series = gpuSeries(gpu);
    // Reference cards are a two-tone metal frame (dark grey with bronze),
    // while partner cards wear their maker's own shroud colour.
    const bodyTone = series.shroud === 'founders' ? 0x2e3138 : design.body;
    const shroudMaterial = mat(`gpu-shroud:${design.key}:${series.shroud}`, () => new THREE.MeshStandardMaterial({
      color: bodyTone,
      metalness: series.shroud === 'founders' ? 0.92 : design.metalness * 0.95,
      roughness: series.shroud === 'founders' ? 0.24 : design.roughness * 0.85,
    }));
    const faceMaterial = mat(`gpu-face:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.panel,
      metalness: 0.45,
      roughness: 0.52,
    }));
    const chromeMaterial = mat('gpu-chrome', () => new THREE.MeshStandardMaterial({ color: 0x9fb0c8, metalness: 1, roughness: 0.16 }));
    // Reference cards finish their end caps in bronze, custom cards in the
    // maker's own accent, so the card is recognisable from across the case.
    const trimMaterial = mat(`gpu-trim:${design.key}:${accent.getHex()}`, () => new THREE.MeshStandardMaterial({
      color: series.shroud === 'founders' ? 0xb08d57 : accent,
      metalness: series.shroud === 'founders' ? 0.98 : 0.72,
      roughness: series.shroud === 'founders' ? 0.2 : 0.3,
    }));

    // Body with soft edges, a black fan face, and a vented backplate.
    addRoundedBox(partsGroup, depth, height, length, 0.012, centerX, GPU_Y, centerZ, shroudMaterial, 'z');
    addRoundedBox(partsGroup, 0.016, height - 0.016, length - 0.012, 0.008, centerX + depth / 2 - 0.002, GPU_Y, centerZ, faceMaterial, 'x').castShadow = false;

    // Brushed alloy backplate, a shade lighter than the shroud so the card
    // reads as two pieces instead of one dark block.
    const backplateMaterial = mat(`gpu-backplate:${design.key}:${series.shroud}`, () => {
      const tone = new THREE.Color(series.shroud === 'founders' ? 0x3a3f47 : design.body);
      tone.offsetHSL(0, -0.04, 0.16);
      return new THREE.MeshStandardMaterial({
        color: tone,
        metalness: series.shroud === 'founders' ? 0.95 : 0.82,
        roughness: series.shroud === 'founders' ? 0.3 : 0.38,
      });
    });
    const backplate = addRoundedBox(partsGroup, 0.012, height - 0.018, length - 0.018, 0.006, centerX - depth / 2 - 0.003, GPU_Y, centerZ, backplateMaterial, 'x');
    backplate.castShadow = false;
    // Real backplates are perforated, so the card never reads as a black slab
    // from the rear: two rows of vents per fan, plus a fin line down the middle.
    const vents = [];
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 9; column += 1) {
        vents.push([
          centerX - depth / 2 - 0.009,
          GPU_Y - 0.055 + row * 0.019,
          centerZ - length / 2 + 0.05 + column * ((length - 0.1) / 8),
        ]);
      }
    }
    addInstances(partsGroup, new THREE.BoxGeometry(0.004, 0.011, 0.017), faceMaterial, vents);
    addBox(partsGroup, 0.005, 0.008, length - 0.06, centerX - depth / 2 - 0.009, GPU_Y + 0.062, centerZ, trimMaterial).castShadow = false;

    // Glowing top strip and a chrome side rail.
    addBox(partsGroup, depth - 0.05, 0.007, length - 0.04, centerX, GPU_Y + height / 2 - 0.004, centerZ, rgbMaterial('standard', 1.1, accent)).castShadow = false;
    addBox(partsGroup, 0.012, 0.012, length - 0.02, centerX + depth / 2 - 0.004, GPU_Y - height / 2 + 0.008, centerZ, chromeMaterial).castShadow = false;
    // Brand accent: a strip along the shroud edge, split by card family.
    if (series.shroud === 'founders') {
      for (const side of [-1, 1]) {
        addRoundedBox(partsGroup, depth * 0.9, 0.006, 0.02, 0.002, centerX, GPU_Y + side * (height / 2 - 0.012), centerZ - length / 2 + 0.02, trimMaterial, 'z').castShadow = false;
        addRoundedBox(partsGroup, depth * 0.9, 0.006, 0.02, 0.002, centerX, GPU_Y + side * (height / 2 - 0.012), centerZ + length / 2 - 0.02, trimMaterial, 'z').castShadow = false;
      }
    } else {
      // On the far face, not the glass side: this strip used to run straight
      // across the printed wordmark.
      addBox(partsGroup, 0.008, 0.006, length * 0.72, centerX - depth / 2 + 0.004, GPU_Y + height / 2 - 0.018, centerZ, trimMaterial).castShadow = false;
    }

    // Display bracket with three output ports and a thumbscrew.
    addBox(partsGroup, depth + 0.008, 0.012, 0.024, centerX, GPU_Y + height / 2 - 0.01, GPU_REAR_Z - 0.006, chromeMaterial).castShadow = false;
    addBox(partsGroup, depth + 0.004, 0.015, 0.03, centerX, GPU_Y, GPU_REAR_Z - 0.012, shroudMaterial).castShadow = false;
    for (let index = 0; index < 3; index += 1) {
      addBox(partsGroup, 0.05, 0.016, 0.006, centerX + depth / 2 - 0.04 - index * 0.06, GPU_Y - 0.03, GPU_REAR_Z - 0.022, faceMaterial).castShadow = false;
    }

    const fanCount = length > 0.49 ? 3 : 2;
    const pitch = length / fanCount;
    // Slimmer card, three bigger fans: at 22 cm tall with 7 cm rotors the
    // shroud read as a tall black box with three small circles on it.
    // Slightly smaller rotors, dropped a touch lower, so a clear band stays
    // free above them for the printed wordmark. Dropped again here so the sign
    // could move down without its lower edge touching the rotor tips.
    const fanRadius = Math.min(0.056, pitch / 2 - 0.008);
    for (let index = 0; index < fanCount; index += 1) {
      const fanZ = centerZ - length / 2 + pitch * (index + 0.5);
      addFan(partsGroup, { x: centerX + depth / 2 + 0.007, y: GPU_Y - 0.032, z: fanZ }, fanRadius, {
        rgb: true,
        accent,
        rotationY: Math.PI / 2,
        // No frame bars: the four bars around each rotor lined up into a grid
        // across the card face, which read as a cover lying over the fans.
        framed: false,
        design,
        frameColor: design.frameColor,
        // Card fans are dark rotors, not white ones: taken straight from the
        // brand they caught the studio light and read as pale mint swirls
        // painted over the card face.
        bladeColor: new THREE.Color(design.bladeColor).multiplyScalar(0.42).getHex(),
        brand: gpu.brand || '',
        spin: 1.6,
      });
    }

    // Power connector on the card's top edge.
    addBox(partsGroup, 0.045, 0.022, 0.032, centerX + 0.015, GPU_Y + height / 2 + 0.008, centerZ + length / 2 - 0.07, faceMaterial).castShadow = false;
    addBox(partsGroup, 0.032, 0.008, 0.024, centerX + 0.015, GPU_Y + height / 2 + 0.019, centerZ + length / 2 - 0.07, chromeMaterial).castShadow = false;

    // Printed plate along the card face. Wide enough to actually read: at
    // 0.17 by 0.028 the maker wordmark was a grey smudge behind the glass.
    const plateTex = tex(`plate-gpu:${design.key}:${gpu.id ?? gpu.name}:${accent.getHex()}`, () => brandPlate({
      brand: gpu.brand,
      title: design.mark,
      sub: (gpu.name || '').replace(/NVIDIA |AMD /g, '').slice(0, 22).toUpperCase(),
      accent,
      design,
      // A long thin banner, shaped like the strip of card face above the fans:
      // the square plate texture stretched into this band turned the letters
      // into stripes.
      direction: 'banner',
      pattern: 'none',
      resolution: 3,
    }));
    // One plate, printed on both sides and duplicated either side of the card,
    // so the maker's name shows whichever glass panel you look through.
    const plateW = Math.min(0.52, length * 0.88);
    // 8:1, matching the banner texture: at 12:1 the letters were squeezed
    // sideways because the canvas was wider than the plate.
    const plateH = Math.min(0.046, plateW / 11.3);
    const plateMat = new THREE.MeshStandardMaterial({
      map: plateTex,
      // Glow matched to the power-supply badge, which is the one plate that
      // already read on screen. At 1.5 the whole plate blew out to a white
      // block; the background was glowing as hard as the letters.
      emissive: 0xffffff,
      emissiveMap: plateTex,
      emissiveIntensity: 0.3,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    plateMat.userData.shared = false;
    const plateGeo = new THREE.PlaneGeometry(plateW, plateH);
    // Centred on the card. It used to be pushed to the front end, where the
    // intake fans and the front panel crowded it out of sight.
    const plateZ = centerZ;
    // In the band above the fans, clear of both the rotors below and the
    // glowing top strip above: on the card's side face, where it is seen.
    // Nudged down from +0.062, where the wordmark ran into the card's own top
    // edge and the first and last letters were clipped.
    const plateY = GPU_Y + 0.052;
    // The backplate and face plates are solid boxes that reach past the body:
    // the glass-side face plate spans 0.11 to 0.126, so a label at 0.1245 was
    // *inside* it and never showed. Both copies are pushed clear of that metal.
    [centerX - depth / 2 - 0.014, centerX + depth / 2 + 0.017].forEach((plateX) => {
      const plate = new THREE.Mesh(plateGeo, plateMat);
      // A quarter turn about Y points the plate at the glass, with its width
      // still running along the card's length.
      plate.rotation.y = Math.PI / 2;
      plate.position.set(plateX, plateY, plateZ);
      partsGroup.add(plate);
    });

    // Anti-sag support: short, and it stops on the top of the PSU shroud, so
    // it never reads as a tall bar floating through the case or piercing it.
    const antSagX = centerX + 0.02;
    const antSagZ = centerZ + length / 2 - 0.055;
    const sagTop = GPU_Y - height / 2 - 0.006;
    const sagBottom = -0.29;
    addBox(partsGroup, 0.016, 0.01, 0.05, antSagX, sagTop, antSagZ, chromeMaterial).castShadow = false;
    addCylinder(partsGroup, 0.007, 0.007, Math.max(0.08, sagTop - sagBottom), antSagX, (sagTop + sagBottom) / 2, antSagZ, chromeMaterial, 10).castShadow = false;

    addCable(partsGroup, [
      [centerX + 0.015, GPU_Y + height / 2 + 0.02, centerZ + length / 2 - 0.07],
      [centerX + 0.18, -0.14, centerZ + length / 2 + 0.02],
      [centerX + 0.16, -0.34, 0.08],
      [0.08, -0.285, 0.08],
    ], 0.014, 0x111720);

    const pcCase = getItems(build, 'case')[0];
    const gpuLength = Number(gpu.specs.length) || 0;
    const maxLength = Number(pcCase?.specs.maxGpuLength);
    const fits = !Number.isFinite(maxLength) || gpuLength <= maxLength;
    const measureColor = fits ? 0x6ee7b7 : 0xfb7185;
    if (gpuLength > 0) {
      addDimensionMark(measureGroup, GPU_REAR_Z, GPU_REAR_Z + length, GPU_Y - height / 2 - 0.04, centerX + depth / 2 + 0.015, measureColor, `${gpuLength} mm`);
    }
    if (Number.isFinite(maxLength)) {
      const limitLength = Math.min(CASE_D - 0.18, maxLength * 0.00205);
      addDimensionMark(measureGroup, GPU_REAR_Z, GPU_REAR_Z + limitLength, GPU_Y - height / 2 - 0.16, centerX + depth / 2 + 0.015, fits ? 0x64748b : 0xfb7185, `Case limit ${maxLength} mm`, fits ? 0.55 : 0.9);
    }
  }
