# PC Build Studio

A local-first PC building simulator: pick real parts, check compatibility, wire
the cables, power it on, benchmark it, and learn how a machine goes together.
It runs entirely in the browser — no backend, no accounts, no install step.

**Live demo:** `https://gl3nnnn.github.io/PC-BUILDING-SIMULATOR/`

## What is in it

| Area | What you can do |
| --- | --- |
| 3D Workshop | Bench with the rig on it, removable case panels, parts tray, drag or install, click any part to inspect it |
| Component Inventory | 131 parts across 10 categories, 32 brands, with dimensions, power draw and prices in pesos |
| Compatibility | Nine rule areas graded Compatible / Warning / Incompatible, each with a plain reason |
| Cable management | 11 cable kinds built from your parts, glowing sockets, and a drawn cable for every connection |
| BIOS & Boot | POST checkpoints, beep codes on real failures, a UEFI screen, boot device, OS and driver install |
| Benchmark | Five workload profiles with utilisation, temperatures, power and a named bottleneck |
| Power & thermal | Load watts, PSU headroom, airflow, fan speed and throttling, with the formulas shown |
| Career Mode | Customer briefs with budgets and targets, wallet, XP, reputation, daily challenge |
| Learning Mode | Six guided lessons with practical assessments that explain every wrong answer |
| My Builds | Saved builds on IndexedDB, naming, duplicate, delete, version history, share links, `.glb` export |

## Run it

```
npm start          # serves on http://localhost:8765
```

Any static server works; there is no build step.

## Check it

```
npm test           # 127 tests
npm run check      # data, prices, GitHub Pages readiness, then the tests
```

## How it was built

The project was built in eight phases, and each phase is written up with what it
implemented, the files it touched, the tests it ran, the errors it fixed, what
still limits it and the next recommended step:

**[DEVELOPMENT.md](DEVELOPMENT.md)** — the full phase-by-phase report.

## Layout

```
index.html          app shell, import map, routes
css/                one stylesheet per area
js/app.js           routing, nav, command palette
js/core/            the engines: build, compat, cables, thermal, benchmark,
                    boot, assembly, career, learn, db, achievements, settings
js/data/            catalogue, presets, jobs, repairs, lessons, spec helpers
js/pages/           one module per screen
js/ui/              shared widgets: cards, modals, icons, toast, spec tables
js/three/           scene.js plus rig/ (materials, camera, fans, part models)
scripts/            data validation, price sync, GitHub Pages check
tests/              node --test suite
```

No application logic lives in a single file: state, rendering, camera
controls, part interaction, assembly, hardware data, compatibility, power,
thermal, BIOS, benchmarking, career, learning and saving each have their own
module.
