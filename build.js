#!/usr/bin/env node
'use strict';

/**
 * Build script — obfuscates all JS source files from src/ into dist/
 * Run: node build.js
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs   = require('fs');
const path = require('path');

const SRC_DIR  = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');

// ── Obfuscation options ───────────────────────────────────────────────────────
// Strong enough to deter casual reading, but not so heavy that startup is slow.
const OBFUSCATOR_OPTIONS = {
  compact:                          true,
  controlFlowFlattening:            true,
  controlFlowFlatteningThreshold:   0.4,
  deadCodeInjection:                true,
  deadCodeInjectionThreshold:       0.2,
  debugProtection:                  false,   // don't break Node debugger
  disableConsoleOutput:             false,   // keep console.log working
  identifierNamesGenerator:         'hexadecimal',
  log:                              false,
  numbersToExpressions:             true,
  renameGlobals:                    false,   // keep require/module/exports
  selfDefending:                    false,   // browser-only feature
  simplify:                         true,
  splitStrings:                     true,
  splitStringsChunkLength:          8,
  stringArray:                      true,
  stringArrayCallsTransform:        true,
  stringArrayEncoding:              ['base64'],
  stringArrayIndexShift:            true,
  stringArrayRotate:                true,
  stringArrayShuffle:               true,
  stringArrayWrappersCount:         2,
  stringArrayWrappersType:          'function',
  unicodeEscapeSequence:            false,
  target:                           'node',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function obfuscateFile(srcFile, destFile) {
  const source = fs.readFileSync(srcFile, 'utf8');

  // Keep the shebang line if present (cli.js needs #!/usr/bin/env node)
  let shebang = '';
  let code    = source;
  if (source.startsWith('#!')) {
    const newlineIdx = source.indexOf('\n');
    shebang = source.slice(0, newlineIdx + 1);
    code    = source.slice(newlineIdx + 1);
  }

  const result = JavaScriptObfuscator.obfuscate(code, OBFUSCATOR_OPTIONS);
  fs.writeFileSync(destFile, shebang + result.getObfuscatedCode(), 'utf8');

  const srcSize  = Buffer.byteLength(source,   'utf8');
  const distSize = Buffer.byteLength(shebang + result.getObfuscatedCode(), 'utf8');
  console.log(`  ✔  ${path.basename(srcFile).padEnd(20)} ${(srcSize/1024).toFixed(1)}KB → ${(distSize/1024).toFixed(1)}KB`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\nBuilding hostmargin CLI...\n');
ensureDir(DIST_DIR);

const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.js'));
for (const file of files) {
  obfuscateFile(
    path.join(SRC_DIR,  file),
    path.join(DIST_DIR, file),
  );
}

// Make cli.js executable (no-op on Windows — npm handles it via .cmd wrapper)
const cliDist = path.join(DIST_DIR, 'cli.js');
if (fs.existsSync(cliDist) && process.platform !== 'win32') {
  fs.chmodSync(cliDist, 0o755);
}

console.log(`\nDone! ${files.length} files written to dist/\n`);
