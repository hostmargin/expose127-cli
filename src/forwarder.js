'use strict';

const http  = require('http');
const https = require('https');

/**
 * Forward a tunnelled HTTP request to the local server.
 *
 * @param {object} requestMsg  - Message from tunnel server { method, path, headers, body, requestId }
 * @param {number} localPort   - The port your local app is on
 * @param {string} protocol    - 'http' or 'https'
 * @returns {Promise<object>}  - Response payload to send back over WebSocket
 */
function forwardRequest(requestMsg, localPort, protocol = 'http') {
  return new Promise((resolve) => {
    const { requestId, method, path: urlPath, headers, body } = requestMsg;

    const startTime = Date.now();

    // Strip headers that can confuse Node's http module
    const cleanHeaders = { ...headers };
    delete cleanHeaders['host'];
    delete cleanHeaders['connection'];
    delete cleanHeaders['transfer-encoding'];

    const options = {
      hostname: '127.0.0.1',
      port:     localPort,
      path:     urlPath || '/',
      method:   method  || 'GET',
      headers:  {
        ...cleanHeaders,
        host: `localhost:${localPort}`,
      },
      // Don't verify local TLS certs (self-signed is common in dev)
      rejectUnauthorized: false,
    };

    const lib = protocol === 'https' ? https : http;

    const localReq = lib.request(options, (localRes) => {
      const chunks = [];
      localRes.on('data', (chunk) => chunks.push(chunk));
      localRes.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('base64');
        resolve({
          type:       'response',
          requestId,
          statusCode: localRes.statusCode,
          headers:    localRes.headers,
          body:       responseBody,
          encoding:   'base64',
          durationMs: Date.now() - startTime,
        });
      });
    });

    // Timeout: if local server hangs for 25s, return 504
    localReq.setTimeout(25000, () => {
      localReq.destroy();
      resolve({
        type:       'response',
        requestId,
        statusCode: 504,
        headers:    { 'content-type': 'text/plain' },
        body:       Buffer.from('hostmargin: local server timed out after 25s').toString('base64'),
        encoding:   'base64',
        durationMs: Date.now() - startTime,
      });
    });

    localReq.on('error', (err) => {
      resolve({
        type:       'response',
        requestId,
        statusCode: 502,
        headers:    { 'content-type': 'text/plain' },
        body:       Buffer.from(`hostmargin: could not reach localhost:${localPort} — ${err.message}`).toString('base64'),
        encoding:   'base64',
        durationMs: Date.now() - startTime,
      });
    });

    // Write request body if present
    if (body) {
      try {
        localReq.write(Buffer.from(body, 'base64'));
      } catch (_) {
        // Ignore body write errors
      }
    }

    localReq.end();
  });
}

module.exports = { forwardRequest };
