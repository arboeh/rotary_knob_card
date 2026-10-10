const fs = require('fs');
const path = require('path');
const dir = path.dirname(__filename);
const root = path.join(dir, '..');
const pkg = require(path.join(root, 'package.json'));
const cardContent = fs.readFileSync(path.join(root, 'rotary_knob_card.js'), 'utf-8');
const cardVersion = cardContent.match(/VERSION\s*=\s*['"]([^'"]+)['"]/)?.at(1) ?? '';
if (pkg.version !== cardVersion) {
  console.error(`Version mismatch: ${pkg.version} (package.json) !== ${cardVersion} (card)`);
  process.exit(1);
}
console.log(`Versions match: ${pkg.version}`);
