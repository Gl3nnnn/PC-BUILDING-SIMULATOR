// Model for the case fans.
//
// One module per part family, so a model can be reshaped without touching
// another. Everything it draws comes from the kit it is handed: shared
// surfaces, layout constants and the groups the part is added to.
//
// @param {object} kit Shared helpers, layout constants and scene groups.
import * as THREE from 'three';
import { getItems } from '../../../core/build.js';

export function buildFansModel(kit, build) {
  const {
    addFan, brandStyle, CASE_D, getItems, partsGroup, state
  } = kit;

    const pcCase = getItems(build, 'case')[0];
    const kits = getItems(build, 'fans');
    const selectedCount = kits.reduce((sum, fan) => sum + (Number(fan.specs.count) || 0), 0);
    const count = Math.min(3, selectedCount || Number(pcCase?.specs.includedFans) || 2);
    const hasRgb = kits.some((fan) => fan.specs.rgb);
    const accent = state.accent;
    // A bought fan pack brings its own frame and blade colours; with none
    // chosen, the case's stock fans use the case maker's design.
    const fanKit = kits[0];
    const design = fanKit ? brandStyle(fanKit.brand) : brandStyle(pcCase?.brand);
    const brand = fanKit?.brand || pcCase?.brand || '';
    // The fans sat in a small cluster around the case's middle, leaving the
    // front half of the panel empty. They now occupy the open front area above
    // the shroud, stacked like a real case's intake positions.
    const positions = count >= 3 ? [0.44, 0.15, -0.14] : count === 2 ? [0.44, 0.16] : [0.3];
    // Intake fans sit inside the case, behind the front panel. Mounted almost
    // flush with it, with the wood slats and mesh right in front, they read as
    // stickers applied to the panel instead of fans moving air through it.
    const frontFanRadius = 0.125;
    // Right up against the front panel, just behind the wood slats: parked 11
    // cm back, the perspective pushed the rotors off the panel so the intake
    // fans read as loose discs floating beside the wood instead of fans pulling
    // air through the front of the case.
    const frontFanZ = CASE_D / 2 - 0.042;
    positions.forEach((y) => {
      // No frame, no backing plate: the first attempt mounted the fans almost
      // flush with the front panel, so the rotors drew on top of the wood slats
      // and read as two fans stuck onto the side of the case.
      // Framed, the way a stock intake fan is bolted to the front mount: an
      // open rotor alone read as a flat disc lying loose behind the planks.
      addFan(partsGroup, { x: 0, y, z: frontFanZ }, frontFanRadius, {
        rgb: hasRgb,
        accent,
        framed: true,
        brand,
        design,
        // Dark blades and frame: taking the brand's light fan palette made the
        // intake column read as three silver discs bolted to the front, the
        // brightest thing in the case.
        frameColor: 0x171d27,
        bladeColor: 0x232b38,
      });
    });
    // Rear exhaust. It used to be skipped whenever a tower air cooler was
    // fitted, which left the case back with no fan at all. Every case gets one
    // now, mounted on the back panel the way a real 120 mm exhaust is.
    addFan(partsGroup, { x: -0.17, y: 0.42, z: -CASE_D / 2 + 0.055 }, 0.1, {
      rgb: hasRgb,
      accent,
      framed: true,
      brand,
      design,
      backing: false,
      rotationY: Math.PI,
    });
  }
