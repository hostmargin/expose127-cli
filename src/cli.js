#!/usr/bin/env node
'use strict';

// Must be first — exits immediately if Node is too old (no deps needed)
require('./node-check').checkNodeVersion();

const { program } = require('commander');
const chalk       = require('chalk');

const { printBanner }                                      = require('./banner');
const { startTunnel }                                      = require('./tunnel');
const { validatePort, isPortListening, validateSubdomain } = require('./validate');
const { checkForUpdate }                                   = require('./update-check');
const config                                               = require('./config');

// ── Shared pre-flight: validate port + warn if nothing is listening ───────────
async function preflight(rawPort, options) {
  const portResult = validatePort(rawPort);
  if (!portResult.valid) {
    console.error(chalk.red(`\n  Error: ${portResult.message}\n`));
    process.exit(1);
  }

  if (options.subdomain) {
    const subResult = validateSubdomain(options.subdomain);
    if (!subResult.valid) {
      console.error(chalk.red(`\n  Error: ${subResult.message}\n`));
      process.exit(1);
    }
  }

  const listening = await isPortListening(portResult.port);
  if (!listening) {
    console.log(
      chalk.yellow(`\n  Warning: Nothing seems to be running on localhost:${portResult.port}.`)
    );
    console.log(chalk.gray('  The tunnel will still open but requests will return 502 until your server starts.\n'));
  }

  return portResult.port;
}

// ─────────────────────────────────────────────────────────────────────────────
//  tunnel command   (main command)
// ─────────────────────────────────────────────────────────────────────────────
program
  .name('hostmargin')
  .description('Expose localhost to the internet via hostmargin.com')
  .version(config.VERSION, '-v, --version', 'Print version number');

program
  .command('tunnel <port>', { isDefault: true })
  .alias('t')
  .description('Start a tunnel for the given localhost port')
  .option('-s, --subdomain <n>',      'Request a custom subdomain  (e.g. my-app)')
  .option('-p, --protocol <proto>',   'Local protocol: http or https', 'http')
  .option('--host <host>',            'Override tunnel server host', config.TUNNEL_SERVER_HOST)
  .option('--port <port>',            'Override tunnel server port', String(config.TUNNEL_SERVER_PORT))
  .addHelpText('after', `
Examples:
  $ hostmargin tunnel 3000
  $ hostmargin tunnel 8000 --subdomain my-laravel-app
  $ hostmargin tunnel 5173 --protocol http
  $ hostmargin t 3000
  `)
  .action(async (rawPort, options) => {
    printBanner();
    const localPort = await preflight(rawPort, options);

    // Fire update check in background — prints notice after tunnel_ready
    checkForUpdate('hostmargin').catch(() => {});

    await startTunnel(localPort, {
      subdomain: options.subdomain || null,
      protocol:  options.protocol  || 'http',
      host:      options.host,
      port:      parseInt(options.port, 10),
    });
  });

// ─────────────────────────────────────────────────────────────────────────────
//  status command
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('status')
  .description('Show active tunnels (coming soon)')
  .action(() => {
    console.log(chalk.yellow('\n  Status command coming soon.\n'));
  });

// ─────────────────────────────────────────────────────────────────────────────
//  help footer
// ─────────────────────────────────────────────────────────────────────────────
program.addHelpText('after', `
Quick start:
  $ npx hostmargin 3000
  $ npx hostmargin tunnel 8000 --subdomain my-project

Docs:  https://hostmargin.com/docs/tunnel
`);

program.parse(process.argv);
