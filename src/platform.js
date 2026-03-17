'use strict';

/**
 * Cross-platform helpers.
 * Import this instead of calling process.platform directly anywhere else.
 */

const IS_WINDOWS = process.platform === 'win32';
const IS_MAC     = process.platform === 'darwin';
const IS_LINUX   = process.platform === 'linux';

/**
 * Ora spinner that works on all platforms.
 * Windows CMD/PowerShell cannot render Unicode braille frames (⠋⠙⠹…),
 * so we fall back to plain ASCII dashes on Windows.
 */
const SPINNER = IS_WINDOWS
  ? { interval: 150, frames: ['-', '\\', '|', '/'] }   // ASCII — works in cmd.exe
  : 'dots';                                              // Unicode — works on Mac/Linux

/**
 * Register shutdown handlers that work on all platforms.
 *
 * - SIGINT  (Ctrl+C)   — all platforms
 * - SIGTERM            — Mac/Linux only (kill command, Docker stop, etc.)
 * - SIGHUP             — Mac/Linux only (terminal closed)
 *
 * On Windows, SIGTERM/SIGHUP are not sent by the OS — we skip them silently.
 */
function onShutdown(handler) {
  process.on('SIGINT', handler);

  if (!IS_WINDOWS) {
    process.on('SIGTERM', handler);
    process.on('SIGHUP',  handler);
  }
}

/**
 * Safely set file permissions.
 * chmod is a no-op on Windows (files are always executable if .cmd wrapper exists).
 */
function makeExecutable(filePath) {
  if (IS_WINDOWS) return;
  try {
    require('fs').chmodSync(filePath, 0o755);
  } catch (_) {
    // Non-fatal — npm sets permissions itself during install
  }
}

/**
 * Home directory — works on all platforms.
 * Windows:  C:\Users\YourName
 * Mac/Linux: /home/yourname  or  /Users/yourname
 */
const HOME_DIR = require('os').homedir();

/**
 * Config directory for storing auth tokens etc in future.
 * Windows:  %APPDATA%\hostmargin
 * Mac/Linux: ~/.config/hostmargin
 */
const CONFIG_DIR = IS_WINDOWS
  ? require('path').join(process.env.APPDATA || HOME_DIR, 'hostmargin')
  : require('path').join(HOME_DIR, '.config', 'hostmargin');

module.exports = {
  IS_WINDOWS,
  IS_MAC,
  IS_LINUX,
  SPINNER,
  onShutdown,
  makeExecutable,
  HOME_DIR,
  CONFIG_DIR,
};
