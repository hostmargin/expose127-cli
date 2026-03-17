'use strict';

const WebSocket = require('ws');
const chalk = require('chalk');
const ora = require('ora');

const config = require('./config');
const logger = require('./logger');
const { forwardRequest } = require('./forwarder');
const { SPINNER, onShutdown } = require('./platform');

/**
 * Start a tunnel to the hostmargin server.
 *
 * @param {number} localPort   - Port your local app listens on
 * @param {object} options
 *   @param {string}  options.subdomain  - Requested subdomain (optional)
 *   @param {string}  options.protocol   - 'http' | 'https' (local)
 *   @param {string}  options.host       - Tunnel server host (override)
 *   @param {number}  options.port       - Tunnel server port (override)
 */
async function startTunnel(localPort, options = {}) {
  const {
    subdomain = null,
    protocol = 'http',
    host = config.TUNNEL_SERVER_HOST,
    port = config.TUNNEL_SERVER_PORT,
  } = options;

  let reconnectAttempts = 0;
  let stopped = false;

  // ── Handle Ctrl+C (and SIGTERM/SIGHUP on Mac/Linux) ───────────────────────
  onShutdown(() => {
    stopped = true;
    console.log(chalk.gray('\n\n  Closing tunnel… bye!\n'));
    process.exit(0);
  });

  // ── Connect (and reconnect) loop ───────────────────────────────────────────
  function connect() {
    if (stopped) return;

    const spinner = ora({
      text: reconnectAttempts === 0
        ? `Connecting to ${chalk.cyan('hostmargin')}…`
        : `Reconnecting (attempt ${reconnectAttempts})…`,
      spinner: SPINNER,
    }).start();

    // Build WebSocket URL
    const qs = subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : '';
    const url = `wss://${host}:${port}${config.WS_REGISTER_PATH}${qs}`;

    let ws;
    let pingTimer;
    let tunnelReady = false;

    try {
      ws = new WebSocket(url, {
        headers: {
          'x-hm-client-version': config.VERSION,
          'x-hm-protocol': protocol,
        },
        handshakeTimeout: 10000,
        rejectUnauthorized: false,
        agent: new (require('https').Agent)({ rejectUnauthorized: false }),
      });
    } catch (err) {
      spinner.fail(chalk.red('Could not create connection: ' + err.message));
      handleDisconnect();
      return;
    }

    // ── OPEN ────────────────────────────────────────────────────────────────
    ws.on('open', () => {
      // Server will now send tunnel_ready or error; spinner stays until then
    });

    // ── MESSAGE ─────────────────────────────────────────────────────────────
    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); }
      catch { return; }

      switch (msg.type) {

        // ── Tunnel assigned ─────────────────────────────────────────────────
        case 'tunnel_ready': {
          reconnectAttempts = 0;
          tunnelReady = true;
          spinner.stop();

          const publicUrl = `https://${msg.subdomain}.${config.BASE_DOMAIN}`;

          console.log('');
          console.log(`  ${chalk.bold('Public URL')}   ${chalk.cyan.underline(publicUrl)}`);
          console.log(`  ${chalk.bold('Forwarding')}   ${chalk.gray(publicUrl)} ${chalk.gray('→')} ${chalk.gray(`${protocol}://localhost:${localPort}`)}`);
          console.log(`  ${chalk.bold('Status')}       ${chalk.green('online')}`);

          logger.printTableHeader();

          // Client-side keepalive ping
          pingTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, config.PING_INTERVAL);

          break;
        }

        // ── Incoming HTTP request ────────────────────────────────────────────
        case 'request': {
          const response = await forwardRequest(msg, localPort, protocol);

          // Log after forwarding
          logger.logRequest(
            msg.method,
            response.statusCode,
            msg.path,
            response.durationMs
          );

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(response));
          }
          break;
        }

        // ── Server keepalive ─────────────────────────────────────────────────
        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }

        // ── Server error ─────────────────────────────────────────────────────
        case 'error': {
          spinner.fail(chalk.red(msg.message || 'Server error'));
          if (msg.fatal) {
            stopped = true;
            process.exit(1);
          }
          break;
        }
      }
    });

    // ── ERROR ────────────────────────────────────────────────────────────────
    ws.on('error', (err) => {
      if (!tunnelReady) {
        spinner.fail(chalk.red(`Connection failed: ${err.message}`));
      } else {
        logger.error(`Connection error: ${err.message}`);
      }
    });

    // ── CLOSE ────────────────────────────────────────────────────────────────
    ws.on('close', (code, reason) => {
      clearInterval(pingTimer);

      if (stopped) return;

      if (tunnelReady) {
        logger.warn(`Tunnel disconnected (${code}). Reconnecting…`);
      }

      handleDisconnect();
    });

    // ── Reconnect helper ─────────────────────────────────────────────────────
    function handleDisconnect() {
      if (stopped) return;

      reconnectAttempts++;

      if (reconnectAttempts > config.MAX_RECONNECT_ATTEMPTS) {
        console.log(chalk.red('\n  Too many failed reconnect attempts. Giving up.'));
        console.log(chalk.gray('  Check your internet connection and try again.\n'));
        process.exit(1);
      }

      // Exponential back-off capped at 15 s
      const delay = Math.min(
        config.RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1),
        15000
      );
      setTimeout(connect, delay);
    }
  }

  connect();
}

module.exports = { startTunnel };
