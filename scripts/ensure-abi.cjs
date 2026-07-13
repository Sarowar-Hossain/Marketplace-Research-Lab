// Ensures better-sqlite3 is compiled for the requested runtime before running.
// The app (Electron) and the test suite (system Node) can need different
// native builds; this step removes the manual rebuild ping-pong.
//
// Both checks probe the real runtime — no marker files, nothing to go stale:
//   node:     require the module under system Node.
//   electron: require the module under Electron via ELECTRON_RUN_AS_NODE
//             (Electron's Node runtime and ABI, no window, ~2s).
// Usage: node scripts/ensure-abi.cjs <electron|node>
const { execSync, spawnSync } = require('node:child_process');
const { join } = require('node:path');

const target = process.argv[2];
if (target !== 'electron' && target !== 'node') {
  console.error('Usage: node scripts/ensure-abi.cjs <electron|node>');
  process.exit(1);
}

const rootDir = join(__dirname, '..');

// better-sqlite3 dlopens its native addon lazily, inside the Database
// constructor — a bare require() always succeeds and proves nothing. The
// probe must construct a database to actually load the binary.
const PROBE = "new (require('better-sqlite3'))(':memory:').prepare('SELECT 1').get()";

function loadsUnderNode() {
  const result = spawnSync(process.execPath, ['-e', PROBE], { cwd: rootDir, timeout: 30000 });
  return result.status === 0;
}

function loadsUnderElectron() {
  // Under plain Node, require('electron') resolves to the executable path.
  const electronPath = require('electron');
  const result = spawnSync(electronPath, ['-e', PROBE], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    cwd: rootDir,
    timeout: 30000,
  });
  return result.status === 0;
}

const ok = target === 'node' ? loadsUnderNode() : loadsUnderElectron();
if (ok) {
  console.log(`better-sqlite3 already works under ${target}`);
  process.exit(0);
}

console.log(`Rebuilding better-sqlite3 for ${target}…`);
execSync(target === 'electron' ? 'pnpm rebuild:electron' : 'pnpm rebuild:node', {
  stdio: 'inherit',
  cwd: rootDir,
});
