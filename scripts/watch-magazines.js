const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const worksDir = path.join(rootDir, 'images', 'works');
const generator = path.join(__dirname, 'generate-magazines.js');
const publisher = path.join(__dirname, 'auto-publish.js');
const logFile = path.join(rootDir, 'magazines-watch.log');
const pollIntervalMs = 2000;
const settleDelayMs = 15000;
let running = false;
let pending = false;
let publishing = false;
let publishPending = false;
let lastSnapshot = '';
let lastChangeAt = 0;

function log(message) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`, 'utf8');
}

function runGenerator() {
  if (running) {
    pending = true;
    return;
  }

  running = true;
  const child = spawn(process.execPath, [generator], {
    cwd: rootDir,
    stdio: 'ignore',
    windowsHide: true
  });

  child.on('exit', () => {
    running = false;
    log('Generated magazine data.');
    runPublisher();
    if (pending) {
      pending = false;
      runGenerator();
    }
  });
}

function runPublisher() {
  if (publishing) {
    publishPending = true;
    return;
  }

  publishing = true;
  const child = spawn(process.execPath, [publisher], {
    cwd: rootDir,
    stdio: 'ignore',
    windowsHide: true
  });

  child.on('exit', (code) => {
    publishing = false;
    if (code !== 0) log('Auto-publish exited with an error.');
    if (publishPending) {
      publishPending = false;
      runPublisher();
    }
  });
}

function snapshotDirectory(dir) {
  const entries = [];

  function walk(currentDir) {
    fs.readdirSync(currentDir, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(worksDir, fullPath);
      const stats = fs.statSync(fullPath);
      entries.push(`${relativePath}|${entry.isDirectory() ? 'd' : 'f'}|${stats.mtimeMs}|${stats.size}`);
      if (entry.isDirectory()) walk(fullPath);
    });
  }

  walk(dir);
  return entries.sort().join('\n');
}

runGenerator();
lastSnapshot = snapshotDirectory(worksDir);

setInterval(() => {
  const nextSnapshot = snapshotDirectory(worksDir);
  if (nextSnapshot !== lastSnapshot) {
    lastSnapshot = nextSnapshot;
    lastChangeAt = Date.now();
    log('Change detected. Waiting for files to finish copying.');
    return;
  }

  if (!lastChangeAt || Date.now() - lastChangeAt < settleDelayMs) return;

  lastChangeAt = 0;
  log('Changes settled. Updating site data.');
  runGenerator();
}, pollIntervalMs);

log(`Watching ${path.relative(rootDir, worksDir)} for magazine updates.`);
