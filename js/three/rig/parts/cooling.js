// Model for the CPU and its cooler.
//
// One module per part family, so a model can be reshaped without touching
// another. Everything it draws comes from the kit it is handed: shared
// surfaces, layout constants and the groups the part is added to.
//
// @param {object} kit Shared helpers, layout constants and scene groups.
import * as THREE from 'three';
import { getItems } from '../../../core/build.js';

export function buildCoolingModel(kit, build) {
  const {
    accentOf, addBox, addCable, addCylinder, addFan, addGhost, addInstances, addRoundedBox,
    BOARD_X, brandHub, brandPlate, brandStyle, CASE_H, coolerFinish, CPU_Y, CPU_Z, getItems,
    mat, partsGroup, rgbMaterial, tex, THREE
  } = kit;

    const cpu = getItems(build, 'cpu')[0];
    const cooler = getItems(build, 'cooler')[0];
    const coolerAccent = accentOf(cooler, 0x22d3ee);
    const cpuX = BOARD_X + 0.045;
    const cpuAccent = accentOf(cpu, 0x5b8cff);

    if (cpu) {
      const ihsMaterial = mat('cpu-ihs', () => new THREE.MeshStandardMaterial({
        color: 0xb9c6d6,
        metalness: 0.98,
        roughness: 0.18,
      }));
      addBox(partsGroup, 0.024, 0.115, 0.115, cpuX, CPU_Y, CPU_Z, ihsMaterial);
      const cpuGlow = addBox(partsGroup, 0.005, 0.07, 0.07, cpuX + 0.016, CPU_Y, CPU_Z, new THREE.MeshStandardMaterial({
        color: 0x0a0d14,
        emissive: cpuAccent,
        emissiveIntensity: 1,
        roughness: 0.36,
      }));
      cpuGlow.castShadow = false;
      addBox(partsGroup, 0.008, 0.03, 0.09, cpuX + 0.02, CPU_Y - 0.03, CPU_Z, new THREE.MeshStandardMaterial({
        color: 0x10161f,
        metalness: 0.6,
        roughness: 0.4,
      })).castShadow = false;
    } else {
      addGhost(partsGroup, 0.06, 0.12, 0.12, cpuX, CPU_Y, CPU_Z, 0x5b8cff);
    }

    if (!cooler) {
      addGhost(partsGroup, 0.22, 0.3, 0.2, BOARD_X + 0.16, CPU_Y + 0.06, CPU_Z, coolerAccent);
      return;
    }

    if (cooler.specs.type === 'Air') {
      // Air coolers are where brands look most different: Noctua's beige and
      // brown, be quiet!'s blackout, Thermalright's silver stack.
      const finish = coolerFinish(cooler);
      const coolerDesign = brandStyle(cooler.brand);
      const finMaterial = mat(`cooler-fin:${finish.fins}`, () => new THREE.MeshStandardMaterial({
        color: finish.fins,
        metalness: finish.dark ? 0.62 : 0.92,
        roughness: finish.dark ? 0.44 : 0.22,
      }));
      const copperMaterial = mat(`cooler-copper:${finish.copper}`, () => new THREE.MeshStandardMaterial({
        // Tinted well down: at full copper the cold plate caught the studio
        // light and read as a tan bar lying under the fin stack.
        color: new THREE.Color(finish.copper).multiplyScalar(0.3),
        metalness: 0.85,
        roughness: 0.4,
      }));
      const plateMaterial = mat(`cooler-plate:${finish.plate}`, () => new THREE.MeshStandardMaterial({ color: finish.plate, metalness: 0.5, roughness: 0.42 }));
      const towerX = BOARD_X + 0.165;
      const baseY = CPU_Y;
      // Base plate is a small cold plate under the fins, not a shelf: at
      // 0.2 wide it stuck out past the fin stack and read as a tan plank.
      addRoundedBox(partsGroup, 0.135, 0.02, 0.135, 0.006, towerX, baseY, CPU_Z, copperMaterial, 'y');
      // Fin stack, drawn as one instanced mesh: 22 thin plates.
      const fins = [];
      for (let index = 0; index < 22; index += 1) fins.push([towerX, baseY + 0.028 + index * 0.0132, CPU_Z]);
      addInstances(partsGroup, new THREE.BoxGeometry(0.225, 0.0035, 0.195), finMaterial, fins);
      // Top and bottom plates tie the fin stack together without hiding it.
      // Both take the fin tone: a brighter plate material turned the bottom
      // edge into a tan plank lying across the board.
      addRoundedBox(partsGroup, 0.228, 0.01, 0.2, 0.004, towerX, baseY + 0.318, CPU_Z, finMaterial, 'y');
      addRoundedBox(partsGroup, 0.228, 0.006, 0.2, 0.003, towerX, baseY + 0.03, CPU_Z, finMaterial, 'y');
      // Heat pipes rising through the stack.
      for (let index = 0; index < 4; index += 1) {
        const px = towerX - 0.055 + (index % 2) * 0.11;
        const pz = CPU_Z - 0.045 + Math.floor(index / 2) * 0.09;
        addCylinder(partsGroup, 0.0085, 0.0085, 0.29, px, baseY + 0.155, pz, copperMaterial, 10).castShadow = false;
      }
      // Brand plate across the top of the tower.
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.04),
        new THREE.MeshStandardMaterial({
          map: tex(`plate:${coolerDesign.key}:${cooler.name}:${coolerAccent.getHex()}`, () => brandPlate({
            brand: cooler.brand,
            title: coolerDesign.mark,
            sub: cooler.name ? cooler.name.slice(0, 24) : 'TOWER COOLER',
            accent: coolerAccent,
            design: coolerDesign,
          })),
          roughness: 0.4,
          metalness: 0.3,
        }),
      );
      plate.position.set(towerX + 0.062, baseY + 0.28, CPU_Z);
      plate.rotation.y = Math.PI / 2;
      partsGroup.add(plate);
      // The blade face points at the glass. Flipped the other way the fan's
      // solid backing disc faced out and read as a dark plate bolted to the
      // side of the fin stack. Kept on the rear side of the tower so it never
      // stands in front of the DIMM row.
      addFan(partsGroup, { x: towerX, y: baseY + 0.165, z: CPU_Z - 0.115 }, 0.09, {
        rgb: Boolean(cooler.specs.rgb),
        accent: coolerAccent,
        framed: false,
        brand: cooler.brand || '',
        design: coolerDesign,
        frameColor: finish.frame,
        bladeColor: finish.blades,
        rotationY: Math.PI,
      });
      // One fan only. A push-pull pair put a second rotor behind the fins, and
      // seen through the side glass it read as a stray third fan next to the
      // real one.
      return;
    }

    // Liquid cooler: block, pump cap, radiator, tubes.
    const aioDesign = brandStyle(cooler.brand);
    const pumpMaterial = mat(`aio-pump:${aioDesign.key}`, () => new THREE.MeshStandardMaterial({
      color: aioDesign.dark ? 0x0c0f14 : aioDesign.body,
      metalness: 0.72,
      roughness: 0.26,
    }));
    const pump = addRoundedBox(partsGroup, 0.05, 0.135, 0.135, 0.014, cpuX + 0.022, CPU_Y, CPU_Z, pumpMaterial, 'x');
    pump.castShadow = true;
    const pumpFace = addCylinder(partsGroup, 0.056, 0.056, 0.008, cpuX + 0.05, CPU_Y, CPU_Z, mat('aio-face', () => new THREE.MeshStandardMaterial({ color: 0x080c14, metalness: 0.5, roughness: 0.2 })), 36, 'x');
    pumpFace.castShadow = false;
    const pumpRing = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.007, 8, 40), rgbMaterial('standard', 2.6, coolerAccent));
    pumpRing.rotation.y = Math.PI / 2;
    pumpRing.position.set(cpuX + 0.055, CPU_Y, CPU_Z);
    partsGroup.add(pumpRing);
    const pumpLogo = new THREE.Mesh(
      new THREE.CircleGeometry(0.042, 32),
      new THREE.MeshStandardMaterial({
        map: tex(`aio:${aioDesign.key}:${coolerAccent.getHex()}`, () => brandHub({
          brand: cooler.brand,
          accent: coolerAccent,
          design: aioDesign,
          label: aioDesign.mark,
        })),
        roughness: 0.4,
        metalness: 0.25,
      }),
    );
    pumpLogo.rotation.y = Math.PI / 2;
    pumpLogo.position.set(cpuX + 0.056, CPU_Y, CPU_Z);
    partsGroup.add(pumpLogo);
    // Tube sockets at the top of the block.
    for (const dz of [-0.03, 0.03]) {
      addCylinder(partsGroup, 0.012, 0.012, 0.02, cpuX + 0.032, CPU_Y + 0.075, CPU_Z + dz, pumpMaterial, 12);
    }

    const fanCount = Math.min(3, Math.max(2, Math.round((Number(cooler.specs.radiatorSize) || 240) / 120)));
    const radiatorY = CASE_H / 2 - 0.075;
    const radiatorZ = 0.0;
    const radW = fanCount * 0.185 + 0.04;
    const radiatorMaterial = mat(`aio-rad:${aioDesign.key}`, () => new THREE.MeshStandardMaterial({ color: aioDesign.panel, metalness: 0.8, roughness: 0.3 }));
    addRoundedBox(partsGroup, radW, 0.036, 0.26, 0.008, -0.02, radiatorY, radiatorZ, radiatorMaterial, 'y');
    // Radiator fin rows.
    const radFins = [];
    const radFinCount = Math.max(14, Math.round(radW * 42));
    for (let index = 0; index < radFinCount; index += 1) {
      radFins.push([-0.02 - radW / 2 + 0.022 + index * ((radW - 0.044) / (radFinCount - 1)), radiatorY, radiatorZ]);
    }
    addInstances(partsGroup, new THREE.BoxGeometry(0.004, 0.03, 0.24), mat('aio-radfin', () => new THREE.MeshStandardMaterial({ color: 0x2c3a4f, metalness: 0.9, roughness: 0.24 })), radFins);
    for (const side of [-1, 1]) {
      addBox(partsGroup, 0.012, 0.042, 0.24, -0.02 + side * radW / 2, radiatorY, radiatorZ, radiatorMaterial).castShadow = false;
    }
    const radGlow = addBox(partsGroup, radW - 0.05, 0.006, 0.007, -0.02, radiatorY + 0.021, radiatorZ + 0.125, rgbMaterial('standard', 1.25, coolerAccent));
    radGlow.castShadow = false;
    const fanY = radiatorY - 0.06;
    for (let index = 0; index < fanCount; index += 1) {
      addFan(partsGroup, {
        x: -0.02 - (fanCount - 1) * 0.09 + index * 0.18,
        y: fanY,
        z: radiatorZ,
      }, 0.082, {
        rgb: Boolean(cooler.specs.rgb),
        accent: coolerAccent,
        rotationX: Math.PI / 2,
        // Round rims, not square frames: three framed fans in a row stacked
        // their bars into a cage over the radiator blades.
        framed: false,
        brand: cooler.brand || '',
        design: aioDesign,
      });
    }

    // Braided, slightly glossy tubing back to the radiator.
    // Two short arcs from the pump up to the radiator: offset in Z so they do
    // not overlap, and rising the whole way so they never sag across the GPU.
    addCable(partsGroup, [
      [cpuX + 0.03, CPU_Y + 0.07, CPU_Z + 0.028],
      [cpuX + 0.05, CPU_Y + 0.2, CPU_Z + 0.075],
      [radiatorZ + 0.055, radiatorY - 0.14, radiatorZ + 0.06],
      [radiatorZ + 0.02, radiatorY - 0.02, radiatorZ + 0.05],
    ], 0.011, 0x1a2029);
    addCable(partsGroup, [
      [cpuX + 0.03, CPU_Y + 0.07, CPU_Z - 0.028],
      [cpuX + 0.05, CPU_Y + 0.21, CPU_Z - 0.075],
      [radiatorZ + 0.055, radiatorY - 0.13, radiatorZ + 0.055],
      [radiatorZ + 0.02, radiatorY - 0.02, radiatorZ + 0.045],
    ], 0.011, 0x1a2029);
  }
