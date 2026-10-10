const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const v = require(path.join(root, 'package.json')).version;
const src = fs.readFileSync(path.join(root, 'rotary_knob_card.js'), 'utf-8');
const m = src.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
const c = m ? m[1] : 'unknown';
if (v !== c) {
  console.error('package.json version (' + v + ') does not match card VERSION (' + c + ')');
  process.exit(1);
}
console.log('Versions match: ' + v);
