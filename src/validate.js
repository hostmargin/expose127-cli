'use strict';

const net = require('net');

/**
 * Validate that port is a number in range 1–65535.
 */
function validatePort(port) {
  const n = parseInt(port, 10);
  if (isNaN(n) || n < 1 || n > 65535) {
    return { valid: false, message: `Invalid port "${port}". Must be a number between 1 and 65535.` };
  }
  return { valid: true, port: n };
}

/**
 * Check if something is actually listening on localhost:port.
 * Returns a Promise<boolean>.
 */
function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 1500;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(port, '127.0.0.1');
  });
}

/**
 * Validate subdomain format: lowercase letters, numbers, hyphens only.
 * Max 63 chars (DNS label limit).
 */
function validateSubdomain(sub) {
  if (!sub) return { valid: true };
  if (sub.length > 63) {
    return { valid: false, message: 'Subdomain must be 63 characters or less.' };
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(sub)) {
    return {
      valid: false,
      message: 'Subdomain may only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.',
    };
  }
  return { valid: true };
}

module.exports = { validatePort, isPortListening, validateSubdomain };
