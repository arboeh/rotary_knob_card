const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const changelogPath = path.join(root, 'CHANGELOG.md');
const outputPath = path.join(root, 'RELEASE_NOTES.md');

const tag = process.argv[2];
if (!tag) {
  console.error('Usage: node scripts/extract-release-notes.cjs <tag>');
  process.exit(1);
}

const version = tag.replace(/^v/, '');
const changelog = fs.readFileSync(changelogPath, 'utf-8');

const lines = changelog.split(/\r?\n/);
const header = `## [${version}]`;
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith(header)) {
    startIdx = i;
    break;
  }
}

if (startIdx === -1) {
  if (version.includes('-')) {
    fs.writeFileSync(
      outputPath,
      `Pre-release ${tag}. See CHANGELOG.md for details.\n`,
      'utf-8'
    );
    console.log(`Pre-release notes written for ${tag}`);
    process.exit(0);
  }
  console.error(`No changelog entry found for version ${version}`);
  process.exit(1);
}

const contentLines = [];
for (let i = startIdx + 1; i < lines.length; i++) {
  if (lines[i].startsWith('## [')) break;
  contentLines.push(lines[i]);
}

const result = contentLines
  .join('\n')
  .replace(/^\s+/, '')
  .replace(/\s+$/, '');

if (!result) {
  console.error(`Changelog section for ${version} is empty`);
  process.exit(1);
}

fs.writeFileSync(outputPath, result + '\n', 'utf-8');
console.log(`Release notes written for ${version}`);
