'use strict';

/**
 * Called at the very top of cli.js BEFORE any other require().
 * If the Node version is too old, print a clear message and exit.
 * Must use only Node built-ins (no chalk, no deps — they may not load on old Node).
 */

const MIN_MAJOR = 16;

function checkNodeVersion() {
  const [major] = process.versions.node.split('.').map(Number);

  if (major < MIN_MAJOR) {
    process.stderr.write(
      `\n  hostmargin requires Node.js ${MIN_MAJOR} or higher.\n` +
      `  You are running Node.js ${process.versions.node}.\n\n` +
      `  Download the latest version at: https://nodejs.org\n\n`
    );
    process.exit(1);
  }
}

module.exports = { checkNodeVersion };
