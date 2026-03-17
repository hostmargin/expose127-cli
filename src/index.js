'use strict';

/**
 * Programmatic API — lets other Node.js apps use hostmargin as a library.
 *
 * Usage:
 *   const { tunnel } = require('hostmargin');
 *   const t = await tunnel(3000);
 *   console.log(t.url);   // https://fast-wave-4821.hostmargin.com
 *   t.close();
 */

const WebSocket = require('ws');
const config    = require('./config');
const { forwardRequest } = require('./forwarder');

/**
 * Open a tunnel programmatically.
 *
 * @param {number} localPort
 * @param {object} [options]
 * @returns {Promise<{ url: string, subdomain: string, close: Function }>}
 */
function tunnel(localPort, options = {}) {
  const {
    subdomain = null,
    protocol  = 'http',
    host      = config.TUNNEL_SERVER_HOST,
    port      = config.TUNNEL_SERVER_PORT,
  } = options;

  return new Promise((resolve, reject) => {
    const qs  = subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : '';
    const url = `wss://${host}:${port}${config.WS_REGISTER_PATH}${qs}`;

    const ws = new WebSocket(url, {
      headers: { 'x-hm-client-version': config.VERSION },
      handshakeTimeout: 10000,
    });

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      if (msg.type === 'tunnel_ready') {
        const publicUrl = `https://${msg.subdomain}.${config.BASE_DOMAIN}`;
        resolve({
          url:       publicUrl,
          subdomain: msg.subdomain,
          close:     () => ws.close(1000, 'closed by caller'),
        });
      }

      if (msg.type === 'request') {
        const response = await forwardRequest(msg, localPort, protocol);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(response));
        }
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }

      if (msg.type === 'error') {
        reject(new Error(msg.message || 'Tunnel server error'));
      }
    });

    ws.on('error', reject);
  });
}

module.exports = { tunnel };
