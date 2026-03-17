'use strict';

/**
 * Checks npm registry in the background (non-blocking) and prints a
 * one-line notice if a newer version of hostmargin is available.
 *
 * - Runs as a detached child process so it NEVER delays tunnel startup
 * - Caches the result for 24 hours to avoid hammering npm on every run
 * - Silent on any error (no internet, registry down, etc.)
 */

const https    = require('https');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const chalk    = require('chalk');
const { CONFIG_DIR } = require('./platform');
const { VERSION, BASE_DOMAIN } = require('./config');

const CACHE_FILE     = path.join(CONFIG_DIR, 'update-cache.json');
const CACHE_TTL_MS   = 24 * 60 * 60 * 1000; // 24 hours
const CHECK_TIMEOUT  = 3000;                  // 3 s max

// ── Semver compare (no deps) ──────────────────────────────────────────────────
function isNewer(latest, current) {
  const parse = (v) => v.replace(/^v/, '').split('.').map(Number);
  const [lMaj, lMin, lPat] = parse(latest);
  const [cMaj, cMin, cPat] = parse(current);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}

// ── Fetch latest version from npm registry ────────────────────────────────────
function fetchLatestVersion(pkgName) {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${pkgName}/latest`;
    const req = https.get(url, { timeout: CHECK_TIMEOUT }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).version);
        } catch {
          reject(new Error('Bad response'));
        }
      });
    });
    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── Read / write cache ────────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
  } catch {
    // Non-fatal
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Print update notice if a newer version is available.
 * Call this AFTER the tunnel_ready message so it doesn't clutter startup.
 */
async function checkForUpdate(pkgName = 'hostmargin') {
  try {
    const cache = readCache();
    const now   = Date.now();

    let latest;
    if (cache && (now - cache.checkedAt) < CACHE_TTL_MS) {
      latest = cache.latest;
    } else {
      latest = await fetchLatestVersion(pkgName);
      writeCache({ latest, checkedAt: now });
    }

    if (latest && isNewer(latest, VERSION)) {
      console.log('');
      console.log(
        chalk.yellow('  Update available: ') +
        chalk.gray(VERSION) + chalk.gray(' → ') + chalk.green(latest)
      );
      console.log(
        chalk.gray('  Run: ') +
        chalk.cyan(`npm install -g ${pkgName}`) +
        chalk.gray(`  or  npx ${pkgName}@latest <port>`)
      );
    }
  } catch {
    // Silent — never crash the CLI over an update check
  }
}

module.exports = { checkForUpdate };
