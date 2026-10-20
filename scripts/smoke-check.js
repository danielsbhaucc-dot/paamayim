#!/usr/bin/env node
/**
 * Smoke check (no emulator): catches the classes of startup crash we've hit.
 * (a) index.js must import ./src/polyfills before any other code.
 * (b) If an exported Android bundle exists (dist/, from
 *     `expo export --platform android --no-bytecode`), every Hermes-missing
 *     global it uses must also be polyfilled in that bundle.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const fail = (msg) => { console.error('SMOKE FAIL: ' + msg); process.exitCode = 1; };

// (a) entry order
const entry = fs.readFileSync(path.join(root, 'index.js'), 'utf8');
const code = entry.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//'));
if (!/^import\s+['"]\.\/src\/polyfills(\.ts)?['"];?$/.test(code[0] || '')) {
  fail(`first statement of index.js must be "import './src/polyfills';" (got: ${code[0]})`);
} else console.log('ok  index.js loads polyfills first');

// (b) bundle scan
const GLOBALS = ['structuredClone']; // add more Hermes-missing globals here as needed
const jsDir = path.join(root, 'dist', '_expo', 'static', 'js', 'android');
if (!fs.existsSync(jsDir)) {
  console.log('skip bundle scan (no dist/ — run expo export --platform android --no-bytecode)');
} else {
  const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
  if (!files.length) fail(`no .js bundle in ${jsDir} (exported as bytecode? use --no-bytecode)`);
  for (const f of files) {
    const src = fs.readFileSync(path.join(jsDir, f), 'utf8');
    for (const g of GLOBALS) {
      const used = new RegExp(`\\b${g}\\s*\\(`).test(src);
      const polyfilled = new RegExp(`\\.${g}\\s*=`).test(src);
      if (used && !polyfilled) fail(`${f} calls ${g}() but no polyfill assigns it`);
      else console.log(`ok  ${f}: ${g} ${used ? 'used + polyfilled' : 'not used'}`);
    }
  }
}
if (!process.exitCode) console.log('smoke check passed');
