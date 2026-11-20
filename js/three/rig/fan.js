// Fan model for the 3D rig.
//
// A fan is drawn by three part families (the tower cooler, the case front and
// the graphics card), so it lives in its own module with a factory: the scene
// hands it the shared surfaces and its live rotor list, and gets back addFan.
import * as THREE from 'three';

/**
 * Build the fan helper for one scene.
 *
 * @param {object} deps
 * @param {object} deps.state     Scene state, read for its accent colour.
 * @param {Array}  deps.fanRotors Live rotor list the animation loop spins.
 * @param {object} deps.surfaces  Shared geometry, material and texture kit.
 * @param {Function} deps.brandStyle Brand design lookup for a maker's frame.
 * @param {Function} deps.brandHub   Hub sticker artwork for the maker.
 * @returns {Function} addFan(parent, position, radius, fanOptions)
 */
export function createFanKit({ state, fanRotors, surfaces, brandStyle, brandHub }) {
  const {
    mat, geo, own, tex, addRoundedBox, addScrew, rgbMaterial,
  } = surfaces;

  return function addFan(parent, position, radius, fanOptions = {}) {
    function addFan(parent, position, radius, fanOptions = {}) {
      const {
        rgb = false,
        accent = state.accent,
        rotationX = 0,
        rotationY = 0,
        rotationZ = 0,
        framed = true,
        frameColor = null,
        bladeColor = null,
        design = null,
        brand = '',
        spin = 1,
        opacity = 1,
        backing = true,
      } = fanOptions;
      const group = new THREE.Group();
      const border = radius * 0.085;
      const depth = radius * 0.24;
      // Each maker sells its own fan: the frame and blade tones come from the
      // brand profile unless the caller names a specific colour.
      const fanDesign = design || brandStyle(brand);
      const frameTone = frameColor ?? fanDesign.frameColor;
      const bladeTone = bladeColor ?? fanDesign.bladeColor;

      const frameMaterial = mat(`fan-frame:${frameTone}:${fanDesign.key}`, () => new THREE.MeshStandardMaterial({
        color: frameTone,
        roughness: fanDesign.dark ? 0.62 : 0.52,
        metalness: fanDesign.dark ? 0.3 : 0.45,
      }));
      const bladeMaterial = mat(`fan-blade:${bladeTone}:${fanDesign.key}`, () => new THREE.MeshStandardMaterial({
        color: bladeTone,
        roughness: fanDesign.dark ? 0.48 : 0.34,
        metalness: fanDesign.dark ? 0.18 : 0.32,
        side: THREE.DoubleSide,
      }));

      if (framed) {
        const size = (radius + border) * 2;
        const barThickness = depth * 0.86;
        const frameMaterialShared = frameMaterial;
        // Frame built from four rounded bars: no punched-hole geometry, so the
        // opening is always clean and the rotor is never covered.
        addRoundedBox(group, size, border, barThickness, border * 0.4, 0, radius + border * 0.5, 0, frameMaterialShared);
        addRoundedBox(group, size, border, barThickness, border * 0.4, 0, -radius - border * 0.5, 0, frameMaterialShared);
        addRoundedBox(group, border, size, barThickness, border * 0.4, radius + border * 0.5, 0, 0, frameMaterialShared);
        addRoundedBox(group, border, size, barThickness, border * 0.4, -radius - border * 0.5, 0, 0, frameMaterialShared);
        const opening = new THREE.Mesh(
          geo(`fan-opening:${radius.toFixed(4)}:${border.toFixed(4)}`, () => new THREE.TorusGeometry(radius + border * 0.3, border * 0.42, 8, 48)),
          frameMaterialShared,
        );
        opening.castShadow = false;
        group.add(opening);

        // Corner screws: the tiny detail that sells the scale.
        const screwMaterial = mat('fan-screw', () => new THREE.MeshStandardMaterial({ color: 0x71809b, metalness: 0.92, roughness: 0.26 }));
        const corner = radius + border * 0.22;
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            addScrew(group, sx * corner, sy * corner, depth * 0.46, radius * 0.045, screwMaterial);
          }
        }
      } else {
        // Unframed fans still get a chunky housing ring: a hairline rim left the
        // rotor looking like a bare disc pasted onto the front panel.
        const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.075, 10, 56), frameMaterial);
        group.add(rim);
      }

      // The light ring sits just inside the frame opening.
      const ringMaterial = rgb
        ? rgbMaterial('standard', 2.5, accent)
        : mat(`fan-ring:${accent.getHex()}`, () => new THREE.MeshStandardMaterial({
          color: 0x080b11,
          emissive: accent,
          emissiveIntensity: 0.6,
          roughness: 0.32,
          metalness: 0.2,
        }));
      const glowRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.93, radius * 0.028, 8, 64), ringMaterial);
      group.add(glowRing);

      // Diffuser behind the blades, so the fan never looks see-through. Fans whose
      // motor face points at the viewer skip it: seen from outside the case the
      // plate read as a dark disc floating in the back wall instead of a fan.
      if (backing) {
        const backingMesh = new THREE.Mesh(
          new THREE.CircleGeometry(radius * 0.95, 40),
          mat('fan-backing', () => new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.7, metalness: 0.2 })),
        );
        backingMesh.position.z = -depth * 0.42;
        group.add(backingMesh);
      }

      const rotor = new THREE.Group();
      rotor.position.z = -depth * 0.05;
      group.add(rotor);

      const bladeGeometry = geo(`fan-blade-geo:${radius.toFixed(4)}`, () => createBladeGeometry(radius));
      const bladeCount = radius > 0.11 ? 9 : 7;
      for (let index = 0; index < bladeCount; index += 1) {
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.rotation.z = (index * Math.PI * 2) / bladeCount;
        blade.castShadow = false;
        rotor.add(blade);
      }

      const hub = new THREE.Mesh(
        geo(`fan-hub:${radius.toFixed(4)}`, () => new THREE.CylinderGeometry(radius * 0.2, radius * 0.215, depth * 0.6, 28)),
        mat('fan-hub-mat', () => new THREE.MeshStandardMaterial({ color: 0x0d131d, roughness: 0.4, metalness: 0.55 })),
      );
      hub.rotation.x = Math.PI / 2;
      hub.position.z = depth * 0.22;
      rotor.add(hub);

      const sticker = new THREE.Mesh(
        new THREE.CircleGeometry(radius * 0.185, 32),
        new THREE.MeshStandardMaterial({
          map: tex(`hub:${fanDesign.key}:${accent.getHex()}:${brand}`, () => brandHub({ brand, accent, design: fanDesign, label: brand })),
          roughness: 0.42,
          metalness: 0.15,
        }),
      );
      sticker.position.z = depth * 0.62;
      rotor.add(sticker);

      fanRotors.push({ rotor, speed: spin * (0.55 + (radius > 0.11 ? 0 : 0.4)) });

      group.position.set(position.x, position.y, position.z);
      group.rotation.set(rotationX, rotationY, rotationZ);
      if (opacity < 1) {
        group.traverse((child) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = opacity;
          }
        });
      }
      parent.add(group);
      return group;
    }

  };
}

