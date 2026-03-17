'use strict';

/**
 * hostmargin CLI — test suite
 * Run: node test/test.js
 * No test framework needed — uses Node's built-in assert module.
 */

const assert = require('assert');
const http   = require('http');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      result
        .then(() => { console.log(`  ✔  ${name}`); passed++; })
        .catch((err) => { console.log(`  ✗  ${name}\n     ${err.message}`); failed++; });
    } else {
      console.log(`  ✔  ${name}`);
      passed++;
    }
  } catch (err) {
    console.log(`  ✗  ${name}\n     ${err.message}`);
    failed++;
  }
}

console.log('\nhostmargin CLI tests\n');

// ─────────────────────────────────────────────────────────────────────────────
//  validate.js
// ─────────────────────────────────────────────────────────────────────────────
console.log('validate.js');
const { validatePort, validateSubdomain, isPortListening } = require('../src/validate');

test('valid port 3000', () => {
  const r = validatePort('3000');
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.port,  3000);
});

test('valid port 1', () => {
  const r = validatePort('1');
  assert.strictEqual(r.valid, true);
});

test('valid port 65535', () => {
  const r = validatePort('65535');
  assert.strictEqual(r.valid, true);
});

test('invalid port 0', () => {
  assert.strictEqual(validatePort('0').valid, false);
});

test('invalid port 65536', () => {
  assert.strictEqual(validatePort('65536').valid, false);
});

test('invalid port "abc"', () => {
  assert.strictEqual(validatePort('abc').valid, false);
});

test('valid subdomain "my-app"', () => {
  assert.strictEqual(validateSubdomain('my-app').valid, true);
});

test('valid subdomain "abc123"', () => {
  assert.strictEqual(validateSubdomain('abc123').valid, true);
});

test('invalid subdomain starts with hyphen', () => {
  assert.strictEqual(validateSubdomain('-bad').valid, false);
});

test('invalid subdomain ends with hyphen', () => {
  assert.strictEqual(validateSubdomain('bad-').valid, false);
});

test('invalid subdomain has uppercase', () => {
  assert.strictEqual(validateSubdomain('MyApp').valid, false);
});

test('invalid subdomain too long (64 chars)', () => {
  assert.strictEqual(validateSubdomain('a'.repeat(64)).valid, false);
});

test('null subdomain is valid (not required)', () => {
  assert.strictEqual(validateSubdomain(null).valid, true);
});

// ─────────────────────────────────────────────────────────────────────────────
//  platform.js
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nplatform.js');
const platform = require('../src/platform');

test('IS_WINDOWS / IS_MAC / IS_LINUX are booleans', () => {
  assert.strictEqual(typeof platform.IS_WINDOWS, 'boolean');
  assert.strictEqual(typeof platform.IS_MAC,     'boolean');
  assert.strictEqual(typeof platform.IS_LINUX,   'boolean');
});

test('exactly one platform flag is true', () => {
  const count = [platform.IS_WINDOWS, platform.IS_MAC, platform.IS_LINUX]
    .filter(Boolean).length;
  assert.strictEqual(count, 1);
});

test('SPINNER is defined', () => {
  assert.ok(platform.SPINNER !== undefined);
});

test('CONFIG_DIR is a non-empty string', () => {
  assert.strictEqual(typeof platform.CONFIG_DIR, 'string');
  assert.ok(platform.CONFIG_DIR.length > 0);
});

// ─────────────────────────────────────────────────────────────────────────────
//  config.js
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nconfig.js');
const config = require('../src/config');

test('TUNNEL_SERVER_PORT is a number', () => {
  assert.strictEqual(typeof config.TUNNEL_SERVER_PORT, 'number');
});

test('VERSION matches package.json', () => {
  const pkg = require('../package.json');
  assert.strictEqual(config.VERSION, pkg.version);
});

test('BASE_DOMAIN is set', () => {
  assert.ok(config.BASE_DOMAIN.length > 0);
});

// ─────────────────────────────────────────────────────────────────────────────
//  isPortListening — async test against a real temporary server
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nisPortListening (async)');

test('detects a real listening server', async () => {
  const server = http.createServer((_, res) => res.end('ok'));
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const result = await isPortListening(port);
  server.close();

  assert.strictEqual(result, true);
});

test('returns false for a closed port', async () => {
  // Port 19999 is very unlikely to be in use
  const result = await isPortListening(19999);
  assert.strictEqual(result, false);
});

// ─────────────────────────────────────────────────────────────────────────────
//  forwarder.js — forward a real HTTP request to a local test server
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nforwarder.js (async)');
const { forwardRequest } = require('../src/forwarder');

test('forwards GET and returns 200', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('hello from local');
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const response = await forwardRequest(
    { requestId: 'test-1', method: 'GET', path: '/', headers: {}, body: null },
    port, 'http'
  );
  server.close();

  assert.strictEqual(response.statusCode, 200);
  const body = Buffer.from(response.body, 'base64').toString();
  assert.strictEqual(body, 'hello from local');
});

test('returns 502 when local server is not running', async () => {
  const response = await forwardRequest(
    { requestId: 'test-2', method: 'GET', path: '/', headers: {}, body: null },
    19998, 'http'
  );
  assert.strictEqual(response.statusCode, 502);
});

test('forwards POST with body', async () => {
  const server = http.createServer((req, res) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ received: data }));
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const body = Buffer.from('{"name":"test"}').toString('base64');
  const response = await forwardRequest(
    { requestId: 'test-3', method: 'POST', path: '/api', headers: { 'content-type': 'application/json' }, body },
    port, 'http'
  );
  server.close();

  assert.strictEqual(response.statusCode, 201);
  const parsed = JSON.parse(Buffer.from(response.body, 'base64').toString());
  assert.strictEqual(parsed.received, '{"name":"test"}');
});

// ─────────────────────────────────────────────────────────────────────────────
//  Summary (printed after async tests settle)
// ─────────────────────────────────────────────────────────────────────────────
setTimeout(() => {
  console.log(`\n  ${passed + failed} tests  —  ${passed} passed  ${failed > 0 ? failed + ' failed' : ''}\n`);
  if (failed > 0) process.exit(1);
}, 2000);
