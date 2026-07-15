const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const logFile = path.join(rootDir, 'magazines-watch.log');

function log(message) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`, 'utf8');
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    timeout: 120000,
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const errorText = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    throw new Error(`${command} ${args.join(' ')} failed: ${errorText}`);
  }

  return result.stdout.trim();
}

function hasChanges() {
  return run('git', ['status', '--porcelain']).length > 0;
}

try {
  if (!hasChanges()) {
    log('No changes to publish.');
    process.exit(0);
  }

  run('git', ['add', '--', '.gitignore', 'README.md', 'index.html', 'magazines-data.js', 'scripts', 'images/works/cover*']);

  if (!hasChanges()) {
    log('No staged changes to publish.');
    process.exit(0);
  }

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  run('git', ['commit', '-m', `Auto update portfolio magazines ${timestamp}`]);
  run('git', ['push', 'origin', 'main']);
  log('Published changes to GitHub.');
} catch (error) {
  log(`Publish failed: ${error.message}`);
  process.exit(1);
}
