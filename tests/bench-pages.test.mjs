// Benchmark tests, and the GitHub Pages production checks.
//
// Two things are covered here. First the benchmark maths: five workloads, a
// score per workload, utilisation, memory, temperatures, power and a named
// limiter — and the honesty rule that frames are only quoted where frames
// exist. Second the Pages build: the app has to be servable from a subfolder
// with no backend, no absolute paths and no missing file behind the service
// worker. That check is the project's own script, run here so a broken deploy
// fails the suite rather than the live site.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { emptyBuild } from '../js/core/build.js';
import { runBenchmarks, PROFILES, PROFILE_BY_ID, BENCHMARK_NOTES } from '../js/core/benchmark.js';
import { PRESETS } from '../js/data/presets.js';

const ROOT = process.cwd();

function buildWith(items) {
  const build = emptyBuild('Bench build');
  Object.assign(build.items, items);
  return build;
}

/* --- benchmark ------------------------------------------------------------ */

test('the five workload profiles named in the spec exist', () => {
  const ids = PROFILES.map((profile) => profile.id);
  assert.equal(ids.length, 5, `expected five workloads, got ${ids.length}`);
  for (const required of ['esports', 'aaa', 'productivity', 'rendering', 'stress']) {
    assert.ok(PROFILE_BY_ID[required], `${required} is missing from the profiles`);
  }
  for (const profile of PROFILES) {
    assert.ok(profile.label && profile.blurb, `${profile.id}: needs a name and a description`);
    assert.ok(profile.work && profile.work.length > 10, `${profile.id}: needs to say what the run does`);
  }
});

test('every preset runs all five workloads with a complete report', () => {
  for (const preset of PRESETS) {
    const run = runBenchmarks(buildWith(preset.items));
    assert.equal(run.ready, true, `${preset.id} should be able to run`);
    assert.equal(run.profiles.length, 5, `${preset.id}: every workload ran`);
    assert.ok(run.cpu, `${preset.id}: names the chip under test`);
    assert.ok(run.gpu || run.cpu.specs?.igpuScore > 0,
      `${preset.id}: a machine with no card must have onboard graphics instead`);
    for (const profile of run.profiles) {
      assert.ok(Number.isFinite(profile.score) && profile.score > 0, `${preset.id}/${profile.id}: score`);
      assert.ok(profile.cpuIndex > 0, `${preset.id}/${profile.id}: CPU index`);
      assert.ok(profile.gpuIndex >= 0,
        `${preset.id}/${profile.id}: GPU index, zero when there is no card`);
      for (const core of ['cpu', 'gpu']) {
        assert.ok(profile.utilization[core] >= 0 && profile.utilization[core] <= 100,
          `${preset.id}/${profile.id}: ${core} utilisation ${profile.utilization[core]} is a percentage`);
      }
      assert.ok(profile.ram.used >= 0 && profile.ram.used <= profile.ram.installed,
        `${preset.id}/${profile.id}: memory used fits the installed amount`);
      assert.ok(profile.ram.percent >= 0 && profile.ram.percent <= 100,
        `${preset.id}/${profile.id}: memory is reported as a percentage`);
      assert.ok(Number.isFinite(profile.power.watts) && profile.power.watts > 0,
        `${preset.id}/${profile.id}: the run draws power`);
      assert.ok(profile.limiter && profile.limiter.kind, `${preset.id}/${profile.id}: names a limiter`);
      const named = profile.limiter.label || profile.limiter.kind;
      assert.ok(named && named.length >= 3,
        `${preset.id}/${profile.id}: the limiter is named in words`);
      for (const reading of [profile.temps.cpu, profile.temps.gpu]) {
        assert.ok(reading === null || (Number.isFinite(reading) && reading > 20 && reading <= 110),
          `${preset.id}/${profile.id}: temperature ${reading} is out of range`);
      }
      assert.equal(typeof profile.throttled, 'boolean', `${preset.id}/${profile.id}: says whether it throttled`);
    }
  }
});

test('frames are quoted for the gaming workloads and nowhere else', () => {
  const run = runBenchmarks(buildWith(PRESETS.find((preset) => preset.items.gpu?.length).items));
  for (const profile of run.profiles) {
    const gaming = profile.id === 'esports' || profile.id === 'aaa';
    assert.equal(Boolean(profile.fps), gaming, `${profile.id}: frames quoted only where frames exist`);
    if (gaming) {
      assert.ok(profile.fps.average > 0, `${profile.id}: an average frame rate`);
      const low = profile.fps.onePercent ?? profile.fps.low ?? profile.fps.onePercentLow;
      assert.ok(low > 0, `${profile.id}: a 1% low`);
      assert.ok(low <= profile.fps.average, `${profile.id}: the 1% low is below the average`);
      assert.ok(profile.fps.quality, `${profile.id}: states the quality setting`);
    }
  }
});

test('the report is deterministic: the same build always scores the same', () => {
  const build = buildWith(PRESETS[0].items);
  const first = runBenchmarks(build);
  const second = runBenchmarks(buildWith(PRESETS[0].items));
  for (let i = 0; i < first.profiles.length; i += 1) {
    assert.equal(first.profiles[i].score, second.profiles[i].score, `${first.profiles[i].id}: score is stable`);
    assert.equal(first.profiles[i].utilization.cpu, second.profiles[i].utilization.cpu, `${first.profiles[i].id}: CPU use is stable`);
  }
  assert.equal(first.best.score, second.best.score, 'and so is the best result');
});

test('a stronger card raises the gaming score, and the best result is the top one', () => {
  const weak = runBenchmarks(buildWith({ ...PRESETS[0].items, gpu: ['gpu-rtx-3050'] }));
  const strong = runBenchmarks(buildWith({ ...PRESETS[0].items, gpu: ['gpu-rtx-4090'] }));
  const esports = (run) => run.profiles.find((profile) => profile.id === 'esports').score;
  assert.ok(esports(strong) > esports(weak), 'a 4090 scores higher than a 3050');
  for (const run of [weak, strong]) {
    const top = Math.max(...run.profiles.map((profile) => profile.score));
    assert.equal(run.best.score, top, 'the best result is the highest score in the run');
    assert.ok(run.weakest, 'and the weakest is named too');
  }
});

test('the benchmark states that these are simulated figures, not measurements', () => {
  assert.ok(BENCHMARK_NOTES.length >= 6, `expected the formulas to be documented, got ${BENCHMARK_NOTES.length}`);
  const text = JSON.stringify(BENCHMARK_NOTES).toLowerCase();
  assert.match(text, /simulat|estimate|not a measurement|model/i,
    'the notes must say the figures are simulated');
  for (const note of BENCHMARK_NOTES) {
    const label = Array.isArray(note) ? note[0] : note.label || '';
    const body = Array.isArray(note) ? note[1] : note.body || note.text || '';
    assert.ok(String(body).length > 15, `note "${label}" needs a full explanation`);
  }
});

test('a build with no card cannot game, and says so rather than inventing frames', () => {
  const run = runBenchmarks(buildWith({ ...PRESETS[0].items, gpu: [] }));
  const esports = run.profiles.find((profile) => profile.id === 'esports');
  assert.equal(Boolean(esports.fps), false, 'no card, no frame rate');
  assert.ok(esports.limiter.detail && esports.limiter.detail.length > 15,
    'and the reader is told what is holding it back');
});

/* --- GitHub Pages --------------------------------------------------------- */

test('the Pages check passes on this working tree', () => {
  const output = execFileSync(process.execPath, [path.join('scripts', 'check-pages.mjs')], {
    cwd: ROOT, encoding: 'utf8',
  });
  assert.match(output, /Pages check passed/i, 'the project check reports success');
});

test('index.html loads the app with relative paths only, and mounts three.js by name', () => {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.equal(/src="\/|href="\/[^/]/.test(src), false, 'no asset path is absolute');
  assert.match(src, /type="module"/, 'the app starts from a module script');
  assert.match(src, /<script type="importmap">/, 'three.js is mounted by an import map');
  const map = src.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  assert.ok(map, 'the import map is a real script block');
  const spec = map[1].match(/"three":\s*"\.\/?([^"]+)"/);
  assert.ok(spec, 'the import map gives three.js a relative address');
  assert.ok(fs.existsSync(path.join(ROOT, spec[1].replace(/^\.\//, '') || 'vendor/three.module.min.js')),
    `the import map points at a file that exists: ${spec[1]}`);
  assert.equal(/(localhost|127\.0\.0\.1)/.test(src), false, 'no development address leaked into the page');
});

test('the service worker precaches every shipped script and stylesheet', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((match) => match[1]));
  const shipped = ['css', 'js'].flatMap((folder) => {
    const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
    return walk(folder).map((file) => file.split(path.sep).join('/'));
  });
  const missing = shipped.filter((file) => !listed.has(file));
  assert.equal(missing.length, 0, `the offline cache is missing: ${missing.join(', ')}`);
  for (const file of listed) {
    if (file.startsWith('http')) continue;
    assert.ok(fs.existsSync(path.join(ROOT, file)), `the cache lists a file that is not there: ${file}`);
  }
});

test('the deploy workflow stages the static app and runs the checks first', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'deploy-pages.yml'), 'utf8');
  // The Pages check runs as its own step, before the staging step.
  const checkAt = workflow.indexOf('check-pages.mjs');
  const stageAt = workflow.indexOf('Stage static site');
  assert.ok(checkAt > -1, 'the workflow runs the Pages check');
  assert.ok(stageAt > -1, 'the workflow stages the site');
  assert.ok(checkAt < stageAt, 'and the check runs before staging, so a failure stops the deploy');
  for (const folder of ['js', 'css', 'vendor', 'icons']) {
    assert.match(workflow, new RegExp(`${folder}`), `the workflow stages ${folder}`);
  }
  assert.match(workflow, /upload-pages-artifact|upload-artifact/, 'the build is uploaded as a Pages artifact');
  assert.match(workflow, /deploy-pages/, 'and deployed with the Pages action');
  assert.equal(/SUPABASE|SECRET|TOKEN\s*=/.test(workflow), false, 'no secrets or private keys are needed to build');
});

test('every route the menu links to is a real page module', () => {
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  const pages = new Set(fs.readdirSync(path.join(ROOT, 'js', 'pages')).map((file) => file.replace('.js', '')));
  const loaded = [...app.matchAll(/pages\/([a-z-]+)\.js/g)].map((match) => match[1]);
  assert.ok(loaded.length >= 8, `expected the app to import its pages, found ${loaded.length}`);
  for (const page of loaded) {
    assert.ok(pages.has(page), `the app imports ${page}, which is not a page module`);
  }
});
