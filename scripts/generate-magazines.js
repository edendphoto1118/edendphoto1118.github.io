const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const worksDir = path.join(rootDir, 'images', 'works');
const essentialsDir = path.join(worksDir, 'essentials');
const outputFile = path.join(rootDir, 'magazines-data.js');
const toneAnalyzer = path.join(__dirname, 'analyze-essentials-tone.py');
const pythonExecutable = process.env.EDEN_PYTHON || 'C:\\Users\\syding\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const mediaExtensions = new Set([...imageExtensions, ...videoExtensions]);

const issueNames = {
  1: 'THE AWAKENING',
  2: 'THE SILENCE',
  3: 'THE VISION',
  4: 'THE MOMENT',
  5: 'THE MOTION',
  6: 'THE OBSIDIAN'
};

function getIncomingVolumeNumber(folderName) {
  const match = folderName.match(/^vol[\s._-]*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function getVolumeNumber(folderName) {
  if (folderName === 'cover') return 1;
  const match = folderName.match(/^cover(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function getCoverFolderName(volume) {
  return volume === 1 ? 'cover' : `cover${volume}`;
}

function normalizeIncomingFolders() {
  const renamed = [];
  const entries = fs.readdirSync(worksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  entries.forEach((entry) => {
    const volume = getIncomingVolumeNumber(entry.name);
    if (!volume) return;

    const targetName = getCoverFolderName(volume);
    if (entry.name.toLowerCase() === targetName.toLowerCase()) return;

    const sourcePath = path.join(worksDir, entry.name);
    const targetPath = path.join(worksDir, targetName);

    if (fs.existsSync(targetPath)) {
      throw new Error(`Cannot rename ${entry.name} to ${targetName}: target folder already exists.`);
    }

    fs.renameSync(sourcePath, targetPath);
    renamed.push(`${entry.name} -> ${targetName}`);
  });

  return renamed;
}

function naturalPageSort(a, b) {
  const pageA = Number.parseInt(path.basename(a, path.extname(a)), 10);
  const pageB = Number.parseInt(path.basename(b, path.extname(b)), 10);

  if (Number.isFinite(pageA) && Number.isFinite(pageB) && pageA !== pageB) {
    return pageA - pageB;
  }

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function getEssentialNumber(fileName) {
  const match = fileName.match(/^essentials\s*\((\d+)\)\.[^.]+$/i);
  return match ? Number(match[1]) : null;
}

function normalizeEssentialFiles() {
  if (!fs.existsSync(essentialsDir)) return [];

  const renamed = [];
  const files = fs.readdirSync(essentialsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => imageExtensions.has(path.extname(fileName).toLowerCase()));

  const usedNumbers = new Set(files.map(getEssentialNumber).filter(Boolean));
  let nextNumber = 1;

  files
    .filter((fileName) => !getEssentialNumber(fileName))
    .sort(naturalPageSort)
    .forEach((fileName) => {
      while (usedNumbers.has(nextNumber)) nextNumber++;

      const extension = path.extname(fileName).toLowerCase();
      const targetName = `essentials (${nextNumber})${extension}`;
      const sourcePath = path.join(essentialsDir, fileName);
      const targetPath = path.join(essentialsDir, targetName);

      if (fs.existsSync(targetPath)) {
        throw new Error(`Cannot rename ${fileName} to ${targetName}: target file already exists.`);
      }

      fs.renameSync(sourcePath, targetPath);
      usedNumbers.add(nextNumber);
      renamed.push(`${fileName} -> ${targetName}`);
      nextNumber++;
    });

  return renamed;
}

function buildEssentials() {
  if (!fs.existsSync(essentialsDir)) return [];

  const files = fs.readdirSync(essentialsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => imageExtensions.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => {
      const numberA = getEssentialNumber(a);
      const numberB = getEssentialNumber(b);
      if (numberA && numberB && numberA !== numberB) return numberA - numberB;
      if (numberA && !numberB) return -1;
      if (!numberA && numberB) return 1;
      return naturalPageSort(a, b);
    });

  return sortEssentialsByTone(files);
}

function sortEssentialsByTone(files) {
  if (!files.length || !fs.existsSync(toneAnalyzer) || !fs.existsSync(pythonExecutable)) return files;

  const result = spawnSync(pythonExecutable, [toneAnalyzer, essentialsDir, ...files], {
    cwd: rootDir,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 120000
  });

  if (result.status !== 0) {
    const errorText = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    console.warn(`Tone sorting skipped: ${errorText}`);
    return files;
  }

  try {
    const tones = JSON.parse(result.stdout);
    const sortedFiles = tones.map((item) => item.file).filter((fileName) => files.includes(fileName));
    const missingFiles = files.filter((fileName) => !sortedFiles.includes(fileName));
    return [...sortedFiles, ...missingFiles];
  } catch (error) {
    console.warn(`Tone sorting skipped: ${error.message}`);
    return files;
  }
}

function buildMagazine(folderName) {
  const volume = getVolumeNumber(folderName);
  if (!volume) return null;

  const folderPath = path.join(worksDir, folderName);
  const pages = fs.readdirSync(folderPath)
    .filter((fileName) => mediaExtensions.has(path.extname(fileName).toLowerCase()))
    .sort(naturalPageSort);

  if (pages.length === 0) return null;

  const paddedVolume = String(volume).padStart(2, '0');
  const issueName = issueNames[volume] || `VOLUME ${paddedVolume}`;

  return {
    id: `vol-${paddedVolume}`,
    volume,
    title: `ISSUE ${paddedVolume} // ${issueName}`,
    path: `images/works/${folderName}/`,
    pages,
    noShadow: volume === 3
  };
}

const renamedFolders = normalizeIncomingFolders();
const renamedEssentials = normalizeEssentialFiles();

const magazines = fs.readdirSync(worksDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => buildMagazine(entry.name))
  .filter(Boolean)
  .sort((a, b) => a.volume - b.volume);
const essentials = buildEssentials();

const output = `// Auto-generated by scripts/generate-magazines.js. Do not edit manually.
// Add folders named VOL.07, VOL.08, etc. under images/works, then run the generator.
globalThis.EDEN_ESSENTIALS = ${JSON.stringify(essentials, null, 2)};
globalThis.EDEN_MAGAZINES = ${JSON.stringify(magazines, null, 2)};
`;

fs.writeFileSync(outputFile, output, 'utf8');

if (renamedFolders.length) {
  console.log(`Renamed folders: ${renamedFolders.join(', ')}`);
}
if (renamedEssentials.length) {
  console.log(`Renamed essentials: ${renamedEssentials.join(', ')}`);
}
console.log(`Generated ${path.relative(rootDir, outputFile)} with ${essentials.length} essentials and ${magazines.length} magazines.`);
