// Guards the GitHub Pages requirements: the site must work from a folder below
// the domain root (https://<user>.github.io/PC-BUILDING-SIMULATOR/), with no
// backend, no absolute asset paths and no missing files behind a service worker
// entry. Run with `npm run check:pages`.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const failures = [];
const note = [];

function fail(message) {
  failures.push(message);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const rel = (file) => file.split(path.sep).join('/');

// 1. Everything the deploy workflow stages must exist.
const STAGED = [
  'index.html', 'favicon.svg', 'og-image.png', 'manifest.webmanifest', 'sw.js',
  'robots.txt', 'sitemap.xml', '.nojekyll', 'css', 'js', 'data', 'icons', 'vendor',
];
for (const item of STAGED) {
  if (!fs.existsSync(path.join(ROOT, item))) fail(`deploy staging is missing ${item}`);
}
note.push(`staged ${STAGED.length} paths`);

// 2. No absolute or local-only asset references anywhere in the app.
const SOURCE_FILES = [...walk(path.join(ROOT, 'css')), ...walk(path.join(ROOT, 'js')),
  path.join(ROOT, 'index.html'), path.join(ROOT, 'manifest.webmanifest')]
  .filter((file) => /\.(js|css|html|webmanifest)$/.test(file));

const ABSOLUTE_ASSET = /["'(]([/][A-Za-z0-9_.\-/]+\.(?:js|css|png|svg|json|webmanifest|glb))["')]/g;
const LOCAL_HOST = /(localhost|127\.0\.0\.1|:\d{4,5}\b)/;
for (const file of SOURCE_FILES) {
  const src = fs.readFileSync(file, 'utf8');
  for (const match of src.matchAll(ABSOLUTE_ASSET)) {
    if (!match[1].startsWith('//')) fail(`${rel(path.relative(ROOT, file))} uses an absolute path ${match[1]}`);
  }
  if (LOCAL_HOST.test(src)) {
    // js/core/audio.js and friends mention nothing local; js/core/prices.js has no
    // host either. A hit here means a dev URL leaked into a shipped file.
    fail(`${rel(path.relative(ROOT, file))} references a localhost address`);
  }
}
note.push(`scanned ${SOURCE_FILES.length} source files for absolute and localhost paths`);

// 3. Every relative import resolves on disk.
let imports = 0;
for (const file of walk(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js'))) {
  const src = fs.readFileSync(file, 'utf8');
  for (const match of src.matchAll(/from\s+'([^']+)'/g)) {
    const spec = match[1];
    if (!spec.startsWith('.')) {
      if (spec !== 'three') fail(`${rel(path.relative(ROOT, file))} imports the bare specifier "${spec}"`);
      continue;
    }
    imports += 1;
    const target = path.resolve(path.dirname(file), spec);
    if (!fs.existsSync(target)) fail(`${rel(path.relative(ROOT, file))} imports missing ${spec}`);
  }
}
note.push(`resolved ${imports} relative imports`);

// 4. Every service worker cache entry exists on disk, and the list covers all
//    shipped css and js, so an offline visit never hits a missing file.
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const coreBlock = sw.match(/const CORE = \[([\s\S]*?)\];/);
if (!coreBlock) {
  fail('sw.js has no CORE cache list');
} else {
  const entries = [...coreBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1].replace(/^\.\//, ''));
  for (const entry of entries) {
    if (entry === '') continue;
    if (!fs.existsSync(path.join(ROOT, entry))) fail(`sw.js caches a missing file: ${entry}`);
  }
}
const cachedPaths = coreBlock
  ? new Set([...coreBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1].replace(/^\.\//, '')))
  : new Set();
for (const file of [...walk(path.join(ROOT, 'css')), ...walk(path.join(ROOT, 'js'))]) {
  const entry = rel(path.relative(ROOT, file));
  if (!cachedPaths.has(entry)) fail(`sw.js does not cache ${entry}`);
}
note.push(`service worker caches ${cachedPaths.size} files`);

// 5. The 3D view needs its vendored copy of three.js, mapped in the import map.
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const importMap = index.match(/<script type="importmap">([\s\S]*?)<\/script>/);
if (!importMap) {
  fail('index.html has no import map, so "three" cannot resolve');
} else {
  let map;
  try {
    map = JSON.parse(importMap[1]);
  } catch {
    fail('index.html import map is not valid JSON');
  }
  if (map && map.imports?.three === undefined) fail('import map has no "three" entry');
  if (!fs.existsSync(path.join(ROOT, 'vendor/three.module.min.js'))) fail('vendor/three.module.min.js is missing');
}
note.push('three.js is vendored and mapped');

// 6. Routing is hash based, so Pages needs no rewrite rule; the one link form we
//    emit must be a fragment.
const shareCount = [...walk(path.join(ROOT, 'js')).map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n').matchAll(/#\/[a-z]+/g)].length;
note.push(`${shareCount} hash routes found`);

if (failures.length) {
  console.error('GitHub Pages check failed:');
  for (const item of failures) console.error(`  - ${item}`);
  process.exit(1);
}

console.log('GitHub Pages check passed.');
for (const line of note) console.log(`  ${line}`);
