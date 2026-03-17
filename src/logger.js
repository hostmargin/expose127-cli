'use strict';

const chalk      = require('chalk');
const { IS_WINDOWS } = require('./platform');

// ── Use plain dashes on Windows CMD (no Unicode box-drawing) ─────────────────
const LINE = IS_WINDOWS ? '-'.repeat(60) : '─'.repeat(60);

// ── Status code colouring ─────────────────────────────────────────────────────
function colorStatus(code) {
  if (code < 300) return chalk.green(String(code));
  if (code < 400) return chalk.cyan(String(code));
  if (code < 500) return chalk.yellow(String(code));
  return chalk.red(String(code));
}

// ── HTTP method colouring ─────────────────────────────────────────────────────
function colorMethod(method) {
  const colors = {
    GET:    chalk.green,
    POST:   chalk.blue,
    PUT:    chalk.yellow,
    PATCH:  chalk.yellow,
    DELETE: chalk.red,
  };
  const fn = colors[method] || chalk.white;
  return fn(method.padEnd(7));
}

// ── Separator / header ────────────────────────────────────────────────────────
function printTableHeader() {
  console.log('');
  console.log(chalk.gray('  ' + LINE));
  console.log(
    chalk.gray('  ') +
    chalk.bold.gray('Time      ') +
    chalk.bold.gray('Method  ') +
    chalk.bold.gray('Status  ') +
    chalk.bold.gray('Path')
  );
  console.log(chalk.gray('  ' + LINE));
}

// ── Single request log line ───────────────────────────────────────────────────
function logRequest(method, statusCode, urlPath, durationMs) {
  const time     = new Date().toLocaleTimeString('en-US', { hour12: false });
  const duration = durationMs !== undefined
    ? chalk.gray(` ${durationMs}ms`)
    : '';

  console.log(
    chalk.gray('  ') +
    chalk.gray(time + '  ') +
    colorMethod(method) + ' ' +
    colorStatus(statusCode).padEnd(8) + '  ' +
    chalk.white(urlPath) +
    duration
  );
}

// ── Info / warning / error ────────────────────────────────────────────────────
function info(msg)    { console.log(chalk.gray('  ') + chalk.cyan('ℹ') + '  ' + msg); }
function warn(msg)    { console.log(chalk.gray('  ') + chalk.yellow('⚠') + '  ' + msg); }
function error(msg)   { console.log(chalk.gray('  ') + chalk.red('✗') + '  ' + msg); }
function success(msg) { console.log(chalk.gray('  ') + chalk.green('✔') + '  ' + msg); }

module.exports = { printTableHeader, logRequest, info, warn, error, success };
