// Model for the case.
//
// One module per part family, so a model can be reshaped without touching
// another. Everything it draws comes from the kit it is handed: shared
// surfaces, layout constants and the groups the part is added to.
//
// @param {object} kit Shared helpers, layout constants and scene groups.
import * as THREE from 'three';

export function buildCaseModel(kit, pcCase) {
  const {
    accentOf, addBox, addCylinder, addRoundedBox, addScrew, BOARD_X, brandPlate, brandStyle,
    CASE_D, CASE_H, CASE_W, caseGroup, createPerforationTexture, createStreakTexture,
    explodeParts, glow, mat, panelNodes, PLATFORM_Y, platformRing, registerExplode,
    rgbMaterial, rootGroup, SIZE_SCALE, state, tex, THREE
  } = kit;

    explodeParts.length = 0;
    const specs = pcCase?.specs || {};
    const accent = accentOf(pcCase, 0x8b5cf6);
    const design = brandStyle(pcCase?.brand);
    state.accent.copy(accent);
    const size = specs.size || 'Mid Tower';
    const scale = SIZE_SCALE[size] || 1;
    rootGroup.scale.setScalar(scale);
    rootGroup.position.y = PLATFORM_Y + (CASE_H * scale) / 2 + 0.035;

    const frameMaterial = mat(`case-frame:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.body,
      metalness: 0.82,
      roughness: 0.28,
    }));
    const panelMaterial = mat(`case-panel:${design.key}`, () => new THREE.MeshStandardMaterial({
      color: design.panel,
      metalness: 0.55,
      roughness: 0.44,
    }));
    const interiorMaterial = mat('case-interior', () => new THREE.MeshStandardMaterial({
      color: 0x121a26,
      metalness: 0.5,
      roughness: 0.5,
      side: THREE.DoubleSide,
    }));
    const glassMaterial = mat('case-glass', () => new THREE.MeshPhysicalMaterial({
      color: 0x8ab0e0,
      metalness: 0,
      roughness: 0.03,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.9,
    }));
    // Dimmer accent: at 1.25 the strips blew out to pure neon and read as
    // stray glowing bars from above instead of a light strip inside the case.
    const accentMaterial = rgbMaterial('standard', 0.42, accent);
    const glassEdgeMaterial = mat('case-glass-edge', () => new THREE.MeshStandardMaterial({
      color: 0x243449,
      metalness: 0.9,
      roughness: 0.16,
    }));

    // Floor, back and skeleton. The back wall is smoked acrylic rather than
    // an opaque plate, so swinging the camera behind the rig never hides the
    // parts behind a black slab.
    addBox(caseGroup, CASE_W, 0.028, CASE_D, 0, -CASE_H / 2, 0, panelMaterial);
    const backMaterial = mat('case-back', () => new THREE.MeshPhysicalMaterial({
      color: 0x0d1420,
      metalness: 0.2,
      roughness: 0.08,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.5,
    }));
    const backWall = addBox(caseGroup, CASE_W, CASE_H, 0.016, 0, 0, -CASE_D / 2, backMaterial);
    backWall.castShadow = false;
    backWall.receiveShadow = false;
    backWall.renderOrder = 2;

    // The side the camera can swing behind is smoked glass, not a solid wall:
    // an opaque panel turned the whole rig into an unreadable black block.
    const smokedMaterial = mat('case-smoked', () => new THREE.MeshPhysicalMaterial({
      color: 0x0f1520,
      metalness: 0.1,
      roughness: 0.06,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.6,
    }));
    const leftPanel = addRoundedBox(caseGroup, 0.018, CASE_H, CASE_D, 0.008, -CASE_W / 2, 0, 0, smokedMaterial, 'x');
    leftPanel.castShadow = false;
    leftPanel.receiveShadow = false;
    leftPanel.renderOrder = 4;
    registerExplode(leftPanel, new THREE.Vector3(-0.24, 0, 0));
    // Grouped so the workshop can take the panel off in one piece.
    const leftPanelGroup = new THREE.Group();
    leftPanelGroup.add(leftPanel);
    caseGroup.add(leftPanelGroup);
    panelNodes.left = leftPanelGroup;
    for (const [edgeY, height, edgeZ, length] of [
      [CASE_H / 2 - 0.03, 0.012, 0, CASE_D - 0.06],
      [-CASE_H / 2 + 0.03, 0.012, 0, CASE_D - 0.06],
      [0, CASE_H - 0.06, CASE_D / 2 - 0.03, 0.012],
      [0, CASE_H - 0.06, -CASE_D / 2 + 0.03, 0.012],
    ]) {
      const edge = addBox(caseGroup, 0.012, height, length, -CASE_W / 2 - 0.004, edgeY, edgeZ, glassEdgeMaterial);
      edge.castShadow = false;
      leftPanelGroup.add(edge);
    }

    // Tempered glass side panel with polished edges and a reflection streak.
    const glass = addBox(caseGroup, 0.008, CASE_H - 0.075, CASE_D - 0.075, CASE_W / 2, 0, 0, glassMaterial);
    glass.castShadow = false;
    glass.receiveShadow = false;
    glass.renderOrder = 4;
    registerExplode(glass, new THREE.Vector3(0.26, 0, 0));
    const glassGroup = new THREE.Group();
    glassGroup.add(glass);
    caseGroup.add(glassGroup);
    panelNodes.right = glassGroup;
    for (const [edgeY, height, edgeZ, length] of [
      [CASE_H / 2 - 0.04, 0.012, 0, CASE_D - 0.075],
      [-CASE_H / 2 + 0.04, 0.012, 0, CASE_D - 0.075],
      [0, CASE_H - 0.075, CASE_D / 2 - 0.04, 0.012],
      [0, CASE_H - 0.075, -CASE_D / 2 + 0.04, 0.012],
    ]) {
      const edge = addBox(caseGroup, 0.014, height, length, CASE_W / 2 + 0.002, edgeY, edgeZ, glassEdgeMaterial);
      edge.castShadow = false;
      glassGroup.add(edge);
    }
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, CASE_H - 0.2),
      new THREE.MeshBasicMaterial({
        map: tex('streak', createStreakTexture),
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    streak.rotation.y = Math.PI / 2;
    streak.position.set(CASE_W / 2 + 0.008, 0, 0.12);
    streak.renderOrder = 5;
    caseGroup.add(streak);
    glassGroup.add(streak);

    // Roof glass gets its own, clearer material: the shared glass carried the
    // studio reflection at full strength, so looking down from above turned the
    // whole rig into a flat black lid.
    const roofGlassMaterial = mat('case-roof-glass', () => new THREE.MeshPhysicalMaterial({
      color: 0xa8c6ec,
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.035,
      side: THREE.DoubleSide,
      depthWrite: false,
      // Clearcoat and reflections pulled right down: the roof was picking up
      // the dark studio environment, so looking down it turned into a black
      // lid over the whole rig instead of a clear top window.
      clearcoat: 0.12,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.08,
    }));
    const topGlass = addBox(caseGroup, CASE_W - 0.055, 0.007, CASE_D - 0.055, 0, CASE_H / 2 - 0.004, 0, roofGlassMaterial);
    topGlass.castShadow = false;
    topGlass.receiveShadow = false;
    topGlass.renderOrder = 4;
    registerExplode(topGlass, new THREE.Vector3(0, 0.2, 0));
    const roofGroup = new THREE.Group();
    roofGroup.add(topGlass);
    caseGroup.add(roofGroup);
    panelNodes.top = roofGroup;

    // Vertical frame posts and horizontal rails. Kept slim: at the old
    // thickness the glass box read as a heavy cage around the rig.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(caseGroup, 0.011, CASE_H, 0.011, sx * (CASE_W / 2 - 0.02), 0, sz * (CASE_D / 2 - 0.02), frameMaterial);
      }
    }
    for (const sy of [-1, 1]) {
      addBox(caseGroup, CASE_W, 0.012, 0.012, 0, sy * (CASE_H / 2 - 0.02), CASE_D / 2 - 0.02, frameMaterial);
      addBox(caseGroup, CASE_W, 0.012, 0.012, 0, sy * (CASE_H / 2 - 0.02), -CASE_D / 2 + 0.02, frameMaterial);
      addBox(caseGroup, 0.012, 0.012, CASE_D, -CASE_W / 2 + 0.02, sy * (CASE_H / 2 - 0.02), 0, frameMaterial);
      addBox(caseGroup, 0.012, 0.012, CASE_D, CASE_W / 2 - 0.02, sy * (CASE_H / 2 - 0.02), 0, frameMaterial);
    }

    const frontPanel = specs.frontPanel || 'Mesh';
    if (frontPanel.includes('Glass')) {
      const frontGlass = addBox(caseGroup, CASE_W - 0.05, CASE_H - 0.095, 0.007, 0, 0, CASE_D / 2 + 0.004, glassMaterial);
      frontGlass.castShadow = false;
      frontGlass.receiveShadow = false;
      frontGlass.renderOrder = 4;
      registerExplode(frontGlass, new THREE.Vector3(0, 0, 0.24));
    } else {
      const perf = tex('perforation', createPerforationTexture);
      perf.repeat.set(16, 22);
      const meshMaterial = mat('case-mesh', () => new THREE.MeshStandardMaterial({
        color: 0x1b2534,
        metalness: 0.62,
        roughness: 0.5,
        alphaMap: perf,
        alphaTest: 0.35,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        side: THREE.DoubleSide,
      }));
      const frontMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(CASE_W - 0.05, CASE_H - 0.095),
        meshMaterial,
      );
      frontMesh.position.set(0, 0, CASE_D / 2 + 0.003);
      frontMesh.castShadow = false;
      frontMesh.renderOrder = 3;
      caseGroup.add(frontMesh);
      registerExplode(frontMesh, new THREE.Vector3(0, 0, 0.24));

      // Panel frame around the mesh so it reads as a mounted plate.
      for (const [w, h, x, y] of [
        [CASE_W - 0.05, 0.02, 0, CASE_H / 2 - 0.055],
        [CASE_W - 0.05, 0.02, 0, -CASE_H / 2 + 0.055],
        [0.02, CASE_H - 0.09, -CASE_W / 2 + 0.035, 0],
        [0.02, CASE_H - 0.09, CASE_W / 2 - 0.035, 0],
      ]) {
        addBox(caseGroup, w, h, 0.02, x, y, CASE_D / 2 + 0.008, frameMaterial).castShadow = false;
      }

      if (frontPanel.includes('Wood')) {
        // Real North has slats right across the front: they used to cover only
        // the left half and stand outside the frame, so the case looked broken.
        // Darker walnut: at the mid tone the studio light blew the planks out
        // to pale cream, so the front read as painted pine instead of wood.
        const wood = mat('case-wood', () => new THREE.MeshStandardMaterial({ color: 0x4e3117, roughness: 0.86, metalness: 0.04 }));
        const slats = 7;
        const usable = CASE_W - 0.075;
        // Narrower planks with wider gaps: the intake fans sit right behind
        // the front panel, and wide slats closed over them so the whole front
        // read as a solid cover instead of a vented front. The gaps are wider
        // than the planks so each intake fan reads as a full circle of blades
        // through the wood, the way the real North shows its front fans.
        const slatWidth = usable / slats - 0.042;
        for (let index = 0; index < slats; index += 1) {
          const slatX = -usable / 2 + (usable / slats) * (index + 0.5);
          // Flush with the panel frame: standing proud of it the planks looked
          // like they were falling off the front of the case.
          addRoundedBox(caseGroup, slatWidth, CASE_H - 0.13, 0.016, 0.005, slatX, 0, CASE_D / 2 + 0.006, wood, 'y').castShadow = false;
        }
      }
    }

    // Accent light strips sit just inside the frame. They used to float a few
    // millimetres outside the mesh and the glass, which read as glowing bars
    // hanging off the case from any angle.
    // Both strips are kept short and low: running the full height they glowed
    // over the wood slats and across the roof, so the top view showed two stray
    // neon bars instead of a clean front.
    const frontStrip = addBox(caseGroup, 0.011, CASE_H - 0.64, 0.01, CASE_W / 2 - 0.042, -0.1, CASE_D / 2 - 0.005, accentMaterial);
    frontStrip.castShadow = false;
    // The roof bar is gone. Seen from above it cut a bright neon line straight
    // across the top of the case, which read as a stray glowing stick rather
    // than part of the chassis.

    // Front I/O: a real button, USB ports and an audio jack.
    const buttonRing = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.004, 8, 28), accentMaterial);
    buttonRing.position.set(CASE_W / 2 - 0.13, CASE_H / 2 - 0.07, CASE_D / 2 + 0.018);
    buttonRing.castShadow = false;
    caseGroup.add(buttonRing);
    const buttonMaterial = mat('case-button', () => new THREE.MeshStandardMaterial({ color: 0x151d29, metalness: 0.72, roughness: 0.3 }));
    const powerButton = addCylinder(caseGroup, 0.013, 0.013, 0.01, CASE_W / 2 - 0.13, CASE_H / 2 - 0.07, CASE_D / 2 + 0.02, buttonMaterial, 20, 'z');
    powerButton.castShadow = false;
    for (let index = 0; index < 2; index += 1) {
      addBox(caseGroup, 0.03, 0.011, 0.007, CASE_W / 2 - 0.22 - index * 0.045, CASE_H / 2 - 0.07, CASE_D / 2 + 0.017, buttonMaterial).castShadow = false;
    }
    addCylinder(caseGroup, 0.006, 0.006, 0.008, CASE_W / 2 - 0.075, CASE_H / 2 - 0.07, CASE_D / 2 + 0.018, buttonMaterial, 14, 'z').castShadow = false;

    // Maker badge on the front panel, in the brand's own plate style.
    if (pcCase) {
      const badge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.028),
        new THREE.MeshStandardMaterial({
          map: tex(`case-badge:${design.key}:${accent.getHex()}:${pcCase.id}`, () => brandPlate({
            brand: pcCase.brand,
            title: design.mark,
            sub: (specs.size || 'CASE').toUpperCase(),
            accent,
            design,
          })),
          roughness: 0.4,
          metalness: 0.32,
          transparent: true,
        }),
      );
      badge.position.set(-CASE_W / 2 + 0.14, -CASE_H / 2 + 0.038, CASE_D / 2 + 0.008);
      badge.castShadow = false;
      caseGroup.add(badge);
    }

    // Rubber-capped feet.
    const footMaterial = mat('case-foot', () => new THREE.MeshStandardMaterial({ color: 0x1b2230, metalness: 0.7, roughness: 0.36 }));
    const rubberMaterial = mat('case-rubber', () => new THREE.MeshStandardMaterial({ color: 0x05070b, roughness: 0.92, metalness: 0.05 }));
    for (const x of [-CASE_W / 2 + 0.07, CASE_W / 2 - 0.07]) {
      for (const z of [-CASE_D / 2 + 0.07, CASE_D / 2 - 0.07]) {
        addCylinder(caseGroup, 0.024, 0.027, 0.036, x, -CASE_H / 2 - 0.016, z, footMaterial, 18).castShadow = false;
        addCylinder(caseGroup, 0.026, 0.026, 0.006, x, -CASE_H / 2 - 0.034, z, rubberMaterial, 18).castShadow = false;
      }
    }

    // Interior shelf: an open frame along the edges, not a full plate, so the
    // top-down view shows the rig instead of a lid.
    addBox(caseGroup, CASE_W - 0.04, 0.012, 0.06, 0, CASE_H / 2 - 0.062, -CASE_D / 2 + 0.05, interiorMaterial).castShadow = false;
    for (const sx of [-1, 1]) {
      addBox(caseGroup, 0.05, 0.012, CASE_D - 0.05, sx * (CASE_W / 2 - 0.045), CASE_H / 2 - 0.062, 0, interiorMaterial).castShadow = false;
    }
    const grommetMaterial = mat('case-grommet', () => new THREE.MeshStandardMaterial({ color: 0x0a0e15, roughness: 0.85, metalness: 0.1 }));
    for (const [gy, gz] of [[0.24, 0.22], [-0.06, 0.24], [-0.3, 0.16]]) {
      addRoundedBox(caseGroup, 0.006, 0.075, 0.075, 0.02, BOARD_X + 0.09, gy, gz, grommetMaterial, 'x').castShadow = false;
    }
    // A cable-management bar used to sit on this line. With the case narrowed
    // to fit the build it lands inside the opaque shroud, so it is gone rather
    // than kept as an invisible leftover.

    // Rear panel details. The back wall is smoked glass so the interior stays
    // visible, but with the slot covers alone the back read as a bare sheet:
    // it now carries the parts a real case back has outside it.
    const rearZ = -CASE_D / 2 - 0.018;
    const rearPlate = mat('case-rear-plate', () => new THREE.MeshStandardMaterial({
      color: 0x3c4655,
      metalness: 0.82,
      roughness: 0.28,
    }));
    const portMaterial = mat('case-rear-port', () => new THREE.MeshStandardMaterial({ color: 0x070a10, roughness: 0.62, metalness: 0.3 }));
    // Rear I/O cluster: the USB, LAN, audio and video ports, as a grid of cut
    // outs behind the board's shields.
    addRoundedBox(caseGroup, 0.19, 0.11, 0.008, 0.006, BOARD_X + 0.03, 0.335, rearZ, rearPlate, 'y').castShadow = false;
    for (let index = 0; index < 5; index += 1) {
      addBox(caseGroup, 0.026, 0.018, 0.006, BOARD_X - 0.01 + index * 0.032, 0.355, rearZ - 0.005, portMaterial).castShadow = false;
    }
    for (let index = 0; index < 3; index += 1) {
      addBox(caseGroup, 0.03, 0.022, 0.006, BOARD_X + 0.055 + index * 0.036, 0.31, rearZ - 0.005, portMaterial).castShadow = false;
    }
    // Expansion slot covers on the rear panel, each with a thumbscrew.
    for (let index = 0; index < 7; index += 1) {
      const coverY = 0.18 - index * 0.062;
      addBox(caseGroup, 0.02, 0.05, 0.012, BOARD_X + 0.03, coverY, -CASE_D / 2 + 0.012, frameMaterial).castShadow = false;
      addScrew(caseGroup, BOARD_X + 0.03, coverY, -CASE_D / 2 + 0.02, 0.005, frameMaterial);
    }
    // Power supply cut-out: the IEC socket, the rocker switch and a vent grid,
    // which is what you actually see at the bottom of a case back.
    addRoundedBox(caseGroup, 0.36, 0.14, 0.008, 0.006, 0.01, -0.4, rearZ, rearPlate, 'y').castShadow = false;
    addBox(caseGroup, 0.06, 0.05, 0.01, -0.06, -0.4, rearZ - 0.005, portMaterial).castShadow = false;
    addBox(caseGroup, 0.022, 0.026, 0.01, 0.02, -0.4, rearZ - 0.005, portMaterial).castShadow = false;
    for (let index = 0; index < 9; index += 1) {
      addBox(caseGroup, 0.004, 0.1, 0.006, 0.07 + index * 0.012, -0.4, rearZ - 0.004, portMaterial).castShadow = false;
    }
    // Vent slots beside the rear fan opening.
    for (let index = 0; index < 6; index += 1) {
      addBox(caseGroup, 0.09, 0.008, 0.006, -0.17, 0.55 + index * 0.014, rearZ - 0.004, portMaterial).castShadow = false;
    }

    platformRing.material.color.copy(accent);
    glow.material.color.copy(accent);
    return { accent, size, scale, specs };
  }
