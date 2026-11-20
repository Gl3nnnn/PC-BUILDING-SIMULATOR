# Development execution report

Project: **PC Build Studio** — a local-first PC building simulator.
Built incrementally in the eight phases below. Every phase ends with what was
implemented, the files it touched, the tests that were run, the errors that were
fixed, what still limits it, and the next recommended step.

Nothing here is marked complete unless it was actually run or seen working.
Where something is untested, it says so.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Repository audit and architecture preparation | Done |
| 2 | Three.js integration and 3D workshop | Done |
| 3 | Interactive component installation | Done |
| 4 | Hardware compatibility and cable management | Done |
| 5 | Power-on, BIOS and operating system simulation | Done |
| 6 | Benchmark and thermal simulation | Done |
| 7 | Career mode and learning mode | Done |
| 8 | Optimization, testing, documentation, deployment | Done |

Baseline check after the last phase:

```
npm run check
Data valid: 131 products across 10 categories; 131 price entries.
Price file valid: 131 entries, source=sample.
GitHub Pages check passed.
# tests 127
# pass 127
# fail 0
```

---

## Phase 1 — Repository audit and architecture preparation

**Implemented**
- Cloned the upstream project into this folder and ran it locally with a plain
  static server (`npm start`, port 8765). No bundler and no install step.
- Audited the layout: HTML5 + CSS3 + JavaScript ES modules, a vendored three.js,
  a JSON price file, a service worker, and a data validator.
- Fixed the storage contract so the app's build records could be replaced later
  without touching page code.
- Added a scratch-file rule, so screenshots and working copies never reach the
  repository.

**Files created and modified**
- `package.json` (scripts: `start`, `test`, `validate`, `check`)
- `.gitignore`
- `scripts/validate-data.mjs`
- `data/prices.json`
- `js/core/store.js`

**Tests run**
- `npm run validate` — product counts, unique ids, required fields.
- `node --test tests/data.test.mjs`.

**Errors fixed**
- A catalogue count asserted in a test was a hard-coded 100 and would fail as
  the catalogue grew; it now checks uniqueness instead of a magic number.

**Verified**
- The app served and rendered the home page.

**Remaining limitations**
- No build step means every module ships as written, so module count matters.

**Next recommended step**
- Bring the 3D preview up to a presentable standard, because it is the product's
  centrepiece.

---

## Phase 2 — Three.js integration and 3D workshop

**Implemented**
- A studio lighting rig (soft boxes, reflective surroundings), rounded geometry,
  and real materials, so metal and glass reflect instead of reading flat.
- Rebuilt part models: framed fans with swept blades and slow spin, a graphics
  card with shroud, backplate, ports and glow, a motherboard with traces,
  silkscreen, DIMM slots and debug LEDs, tower and liquid coolers, case mesh,
  glass, and drive badges.
- A brand design profile system, so each model follows its maker's real design
  language and colours.
- Product-card artwork redrawn so each chassis has its own silhouette and front.

**Files created and modified**
- `js/three/scene.js`, `js/three/brands.js`
- `js/ui/art.js`
- `js/pages/visualizer.js`
- `css/visualizer.css`

**Tests run**
- Module parse checks on every three.js file.
- Browser checks on every camera angle.

**Errors fixed**
- Smoked panels rendered as solid black walls and hid the whole rig.
- Exploded panels flew out of the viewport.
- Cables overshot their curves and cut through the case shell.
- The case was about twice as wide as the hardware, so parts sat in one corner.
- The rear panel was a bare sheet: no ports, no power cut-out, no fan.
- Rounded-shape helpers produced slightly oversized boxes for thin parts.

**Verified**
- Workstation and office builds checked from side, front, rear, top, exploded,
  then reset, in the browser pane, with no page errors.

**Remaining limitations**
- Every geometry is produced procedurally. The stack supports GLTF/GLB, but no
  downloaded model assets are used; the app exports `.glb` instead.

**Next recommended step**
- Let the user interact with the rig: remove panels, drag parts in, install them.

---

## Phase 3 — Interactive component installation

**Implemented**
- A 3D workshop page: workbench, pegboard, parts tray, anti-static mat, and the
  rig on the bench.
- Removable side and roof panels that slide off onto the worktop and back on.
- A parts tray with category filters; dragging a part onto the bench or pressing
  Install writes it into the real build, so price and compatibility update.
- Click-to-inspect on any part in the scene: name, brand, price, key specs.
- A guided 14-step assembly sequence (case, standoffs, CPU, RAM, paste, cooler,
  board, storage, GPU, PSU, power cables, front panel, fans, inspection) with
  orientation validation and a stated reason every time an install is blocked.
- Install snap animation, and bench sounds.

**Files created and modified**
- `js/pages/workshop.js`, `css/workshop.css`
- `js/core/assembly.js`, `js/core/gameplay.js`, `js/core/career.js`
- `js/ui/workbench.js`, `js/ui/tutorial.js`
- `js/data/jobs.js`, `js/data/repairs.js`
- `js/three/scene.js` (panel control, click picking, bench geometry)
- `js/core/audio.js`

**Tests run**
- `node --test tests/assembly.test.mjs` (15 tests).

**Errors fixed**
- Rebuilding the scene after an install snapped every removed panel back on.
- The tray listed all 131 parts at once; filters now narrow it.
- The inspect card printed a bare number without its unit.
- Installs were possible out of order and on the wrong socket.

**Verified**
- In the browser: panels come off and return, the tray filters, a part installs
  into the build, and the inspect card opens, with no page errors.

**Remaining limitations**
- Drag-and-drop was wired and the equivalent Install buttons were tested; the
  pointer drag itself was not exercised by mouse.
- Cable state does not persist with a saved build.

**Next recommended step**
- Make installation legality and wiring explicit: the compatibility engine and
  the cable rules.

---

## Phase 4 — Hardware compatibility and cable management

**Implemented**
- Structured verdicts per rule area — Compatible, Warning, Incompatible, or Not
  checked — for CPU socket, CPU generation and BIOS, memory, board and case,
  GPU size, cooler, PSU size, PSU wattage and connectors, and storage.
- Three new rules: chipset needing a BIOS update for a newer CPU generation,
  GPU slot thickness against the case, and CPU power cables against the chip.
- Every verdict expands into findings with a plain reason.
- A cable system with 11 kinds (24-pin ATX, 4/8-pin CPU EPS, PCIe, 12V-2x6,
  SATA power, SATA data, front panel, CPU fan, case fan, AIO pump, radiator),
  built from the actual parts, with glowing sockets on the rig and a drawn
  sleeved cable for each plugged connection.
- Wrong sockets are refused with a sentence naming both ends.

**Files created and modified**
- `js/core/compat.js`, `js/pages/compatibility.js`
- `js/core/cables.js`
- `js/three/scene.js` (port markers, cable drawing)
- `css/pages.css`, `css/workshop.css`

**Tests run**
- `node --test tests/compat-rules.test.mjs` (18 tests)
- `node --test tests/cables-power.test.mjs` (22 tests)
- `node --test tests/compatibility.test.mjs` (7 tests)

**Errors fixed**
- The 14th-generation CPU pattern also matched 12th-generation chips, so a
  Budget Office build raised a false BIOS warning.
- The cable rules read a field name the hardware data does not use, so a 16-pin
  card was asked for an old PCIe lead.
- A liquid-cooled build was still asked for a separate CPU fan cable.
- Socket markers were hidden inside the board by the depth test.

**Verified**
- Nine verdict cards read back on screen (8 green, 1 warning) with no errors;
  rule cases checked by script for BIOS, GPU fit and CPU power cables.

**Remaining limitations**
- Cable connections are session state only and are not saved with a build.

**Next recommended step**
- Turn assembly into a consequence: power on, POST, firmware, boot.

---

## Phase 5 — Power-on, BIOS and operating system simulation

**Implemented**
- A Boot page: press power and seven POST checkpoints run with what each found.
- Real failures with reasons and matching beep codes: no memory, empty socket,
  socket mismatch, no display output, weak PSU, undersized cooler. Each offers
  the part to change.
- A UEFI screen with CPU, memory, graphics, storage, cooling and power, a boot
  list built from the user's own drives, and a boot-device choice.
- OS install to completion, then the driver list the machine actually needs.

**Files created and modified**
- `js/core/boot.js`, `js/pages/boot.js`, `css/boot.css`
- `js/app.js`, `index.html`, `sw.js`

**Tests run**
- `node --test tests/boot.test.mjs` (15 tests).

**Errors fixed**
- The sound helper is an object of named sounds, not a function, so clicks threw
  and the page stopped responding.
- A board with no CPU reported the wrong beep code.
- The power card repeated the brand ("ASUS ASUS ROG Strix").
- Install text showed "6000 GB" instead of 6 TB.
- Driver rows rendered as an array, so stray commas appeared between cards.
- The detected-hardware card overflowed its column at narrow widths.

**Verified**
- Player flow on screen: power on, seven checkpoints, Enter BIOS, boot list,
  install to 100%, driver list, no page errors.

**Remaining limitations**
- Failing-POST cases were checked by script, not clicked through on screen.
- The driver install button was not exercised.

**Next recommended step**
- Quantify the machine: benchmarks and thermal simulation.

---

## Phase 6 — Benchmark and thermal simulation

**Implemented**
- A power and thermal model with documented formulas: system load power, PSU
  headroom, CPU and GPU temperature, case airflow, fan speed, cooling efficiency
  and throttle loss.
- A dashboard on the Performance page with a verdict line and three live bars,
  plus a expandable "How the simulation is calculated" list.
- Five workload profiles — Esports, AAA gaming, Productivity, Rendering and
  Stress testing — each with a report: index points, tier badge, CPU and GPU
  utilisation, memory used against installed, temperatures against throttle
  limits, power against the PSU, and a named limiter.
- Frame rates only for the two profiles where frames make sense.
- A run button with a progress sweep, and a table comparing all five profiles.

**Files created and modified**
- `js/core/thermal.js`, `js/pages/performance.js`
- `js/core/benchmark.js`, `js/pages/benchmark.js`, `css/benchmark.css`
- `js/app.js`, `index.html`, `sw.js`

**Tests run**
- `node --test tests/simulation.test.mjs` (7 tests)
- `node --test tests/bench-pages.test.mjs` (12 tests)

**Errors fixed**
- Thermal constants were too harsh: a 58 W chip on a stock cooler read 106 °C.
- Storage capacity read 0 GB because the code looked up a field name the
  catalogue does not use.
- The limiter blamed the CPU while the GPU was also pinned at 100%.
- The profile tab grid cramped at narrow widths.

**Verified**
- Six showcase builds checked by script and one live on screen: office build
  139 W, 81.9 °C, 3% boost loss; the others between 38 °C and 75 °C with no
  throttling.

**Remaining limitations**
- Every number is a plan-level estimate, and the page says so.

**Next recommended step**
- Wrap the systems in game modes: career, repair, and a learning centre.

---

## Phase 7 — Career mode and learning mode (with saving and progression)

**Implemented**
- A header mode switch for Free build, Career and Learn, with the choice
  remembered, plus three mode cards on the dashboard.
- Career loop: customer briefs with budgets and performance targets, a wallet,
  XP and levels, reputation, a daily challenge and a hall of fame.
- A customer scorecard grading promised requirements, plus a shareable poster.
- Repair bench with broken PCs, symptoms, clues and paid fixes.
- Learning Mode: six lessons with step-by-step walkthroughs and a practical
  assessment per lesson; wrong answers are explained and a lesson only passes
  when every answer is right.
- Build library on IndexedDB with naming, load, duplicate, delete, history
  versions and a one-time rescue of the previous local builds.
- Achievements, local user settings, build reports and share links.

**Files created and modified**
- `js/core/mode.js`, `js/ui/modebar.js`, `js/pages/learn.js`,
  `js/data/lessons.js`, `js/core/learn.js`, `css/learn.css`
- `js/pages/career.js`, `js/pages/repair.js`, `css/career.css`
- `js/core/db.js`, `js/core/achievements.js`, `js/pages/data.js`,
  `js/pages/saved.js`, `css/data.css`
- `js/core/settings.js`, `js/core/currency.js`, `js/core/poster.js`
- `js/pages/home.js`, `js/app.js`, `index.html`, `sw.js`

**Tests run**
- `node --test tests/saving.test.mjs` (15 tests)

**Errors fixed**
- A build saved with no budget stored a phantom ₱0, because `Number(null)` is 0
  and passed an "is it a number" check.
- The lesson assessment is per-lesson, not a single blob; a failed attempt is
  recorded rather than silently cleared.
- Tier pills were painted over by dot styles, hiding their text.
- Save dialog's name field appended instead of replacing.

**Verified**
- On screen: mode chip navigates, lesson steps advance, 14 questions answer,
  check marks right and wrong with reasons; a build was saved, reloaded, and a
  history version appeared.

**Remaining limitations**
- IndexedDB work was seen in the browser but is not covered by the automated
  tests, since Node has no IndexedDB. The tests cover the record shape.
- Career grading was verified while building it, not re-run this phase.

**Next recommended step**
- Split the monolith, harden performance, expand the tests, and prepare the
  deploy.

---

## Phase 8 — Optimization, testing, documentation, deployment

**Implemented**
- Split the 3D layer: `scene.js` is now the orchestrator, and materials, camera,
  fans and each part family live in their own modules. No application logic is
  collected in one file.
- `.glb` export of the rig, written natively because the vendored three.js has
  no exporter add-on.
- Performance: rendering pauses when the canvas is off-screen or the tab is
  hidden, a Simplified graphics mode (no shadows, half resolution, ~30 fps),
  and graphics memory is actually freed on leaving a page.
- A failed 3D start shows a plain message with a retry and a link to settings.
- A GitHub Pages check that fails on absolute paths, leaked localhost hosts,
  bare or missing imports, and service-worker entries pointing at nothing.
- The service worker now measures paths from the app's own folder, so it works
  at a domain root and under a repository sub-path.
- Deploy workflow runs the check before staging and publishing.
- The test suite grew to 11 files and 127 tests.

**Files created and modified**
- `js/three/scene.js`, `js/three/rig/surfaces.js`, `js/three/rig/camera.js`,
  `js/three/rig/fan.js`, `js/three/rig/export-glb.js`,
  `js/three/rig/parts/*.js`
- `js/core/settings.js`, `js/pages/visualizer.js`, `js/pages/workshop.js`
- `sw.js`, `scripts/check-pages.mjs`, `package.json`,
  `.github/workflows/deploy-pages.yml`
- `tests/*` — `hardware`, `compat-rules`, `assembly`, `cables-power`, `boot`,
  `saving`, `bench-pages`, `simulation` (new), plus `data` (updated)

**Tests run**

| File | Tests |
| --- | --- |
| `assembly.test.mjs` | 15 |
| `bench-pages.test.mjs` | 12 |
| `boot.test.mjs` | 15 |
| `cables-power.test.mjs` | 22 |
| `compat-rules.test.mjs` | 18 |
| `compatibility.test.mjs` | 7 |
| `data.test.mjs` | 3 |
| `hardware.test.mjs` | 10 |
| `intelligence.test.mjs` | 3 |
| `saving.test.mjs` | 15 |
| `simulation.test.mjs` | 7 |
| **Total** | **127, all passing** |

**Errors fixed**
- The module split dropped helpers the part models call (`addFan`, `trims0`,
  `accentOf`), which broke the 3D view; each model now receives exactly the
  helpers it uses.
- Fine-detail rows on a build with no card never counted as finished.
- The fan helper's option names did not match what the models pass.

**Verified**
- The app loaded from a sub-path shaped like the real Pages address: **16 key
  files answered 200**, **334 module loads** succeeded, and the dashboard, 3D
  view and workshop raised **no page errors**, with three.js loading from the
  vendored file.
- `npm run check` — data, prices, Pages and all 127 tests pass.
- `npm run check:pages` reports: 13 paths staged, 94 source files scanned for
  absolute and localhost paths, 336 relative imports resolved, 100 files in the
  service-worker cache, three.js vendored and mapped, 109 hash routes found.

**Catalogue at the end of this run**

| Measure | Count |
| --- | --- |
| Products | 131 |
| Categories | 10 — case, motherboard, cpu, cooler, ram, gpu, storage, psu, fans, cables |
| Brands | 32, including all nine the spec requires |
| Price entries | 131 |
| Lesson plans | 6 lessons, 14 assessment questions |
| Benchmark workloads | 5 — esports, AAA, productivity, rendering, stress |
| Cable kinds | 11 |
| App routes | 109 incl. aliases |
| Test files / tests | 11 / 127 |

---

## Remaining limitations (whole project)

- **No automated browser test.** The interface was checked by hand in the
  browser pane during development; the test suite covers logic, not screens.
- **IndexedDB is not unit-tested.** Node has no IndexedDB, so saving is verified
  in the browser and its record shape in tests.
- **The deploy workflow has never run from this machine.** It is validated by
  reading it and by running the same check script locally.
- **The `.glb` button was not confirmed through a real file download.**
- **Benchmark and thermal numbers are simulations**, which the pages state.
- **No packaged model assets.** Everything is procedural geometry.
- **Cable state and 3D view state are per visit**, not stored with a build.

## Commands

```
npm start           # serve the app on http://localhost:8765
npm test            # run all 127 tests
npm run validate    # check catalogue data
npm run check:prices# compare prices with the price file
npm run check:pages # fail on anything that breaks GitHub Pages
npm run check       # all of the above, in order
```

## Next recommended step

Add a browser-level smoke test (Playwright or Puppeteer) that loads the app,
walks the career loop and presses the `.glb` export button, so the screens,
IndexedDB and the download are covered by something repeatable instead of by
hand.
