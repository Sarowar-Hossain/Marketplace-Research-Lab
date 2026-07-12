// Ensures better-sqlite3 is compiled for the requested runtime before running.
// The app (Electron) and the test suite (system Node) can need different
// native builds; this step removes the manual rebuild ping-pong.
// Usage: node scripts/ensure-abi.cjs <electron|node>
const { execSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const target = process.argv[2];
if (target !== 'electron' && target !== 'node') {
  console.error('Usage: node scripts/ensure-abi.cjs <electron|node>');
  process.exit(1);
}

const rootDir = join(__dirname, '..');
// Marker written after every ensured rebuild. Running the raw rebuild:*
// scripts manually bypasses the marker; the next ensure run corrects it.
const markerPath = join(rootDir, 'node_modules', '.better-sqlite3-abi');

let marker = null;
try {
  marker = readFileSync(markerPath, 'utf8').trim();
} catch {
  marker = null;
}

if (marker === target) {
  console.log(`better-sqlite3 already built for ${target}`);
  process.exit(0);
}

// Probe under system Node: an ABI-mismatch error means the current binary is
// Electron-built; a successful load means it is Node-loadable (either a Node
// prebuild or a runtime-portable source build — ambiguous for Electron, so
// only the failure case is trusted as a shortcut).
let nodeLoads = false;
let abiMismatch = false;
try {
  require('better-sqlite3');
  nodeLoads = true;
} catch (error) {
  abiMismatch = /NODE_MODULE_VERSION/.test(String(error && error.message));
}

if ((target === 'node' && nodeLoads) || (target === 'electron' && abiMismatch)) {
  writeFileSync(markerPath, target);
  console.log(`better-sqlite3 already built for ${target}`);
  process.exit(0);
}

console.log(`Rebuilding better-sqlite3 for ${target}…`);
execSync(target === 'electron' ? 'pnpm rebuild:electron' : 'pnpm rebuild:node', {
  stdio: 'inherit',
  cwd: rootDir,
});
writeFileSync(markerPath, target);
