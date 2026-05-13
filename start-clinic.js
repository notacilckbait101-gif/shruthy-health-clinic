const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = __dirname;
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function ensureCleanProductionBuild() {
  const buildIdPath = path.join(root, '.next', 'BUILD_ID');
  const middlewareManifestPath = path.join(root, '.next', 'server', 'middleware-manifest.json');
  const shouldBuild = !fs.existsSync(buildIdPath) || !fs.existsSync(middlewareManifestPath);

  if (!shouldBuild) {
    return;
  }

  if (fs.existsSync(path.join(root, '.next'))) {
    fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
  }

  console.log('Production build not found. Building the app first...');
  run(npmCmd, ['run', 'build']);
}

if (!exists('node_modules')) {
  console.log('Installing dependencies...');
  run(npmCmd, ['install']);
}

ensureCleanProductionBuild();

console.log('Starting Shruty Health Clinic on http://localhost:3000');
run(npmCmd, ['run', 'start']);
