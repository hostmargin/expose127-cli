'use strict';

/**
 * Central config for the hostmargin CLI.
 * All server endpoints and defaults live here.
 */
module.exports = {
  // The tunnel server your CLI connects to
  TUNNEL_SERVER_HOST: 'hmrg.xyz',
  TUNNEL_SERVER_PORT: 443,

  // The public base domain (subdomains are served under this)
  BASE_DOMAIN: 'hmrg.xyz',

  // WebSocket endpoint path on the server
  WS_REGISTER_PATH: '/register',

  // How long to wait before reconnecting after a drop (ms)
  RECONNECT_DELAY: 3000,

  // Max reconnect attempts before giving up
  MAX_RECONNECT_ATTEMPTS: 10,

  // Keepalive ping interval (ms) - client-side safety net
  PING_INTERVAL: 30000,

  // Version string shown in CLI header
  VERSION: require('../package.json').version,
};
