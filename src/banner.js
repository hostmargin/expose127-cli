'use strict';

const chalk      = require('chalk');
const config     = require('./config');
const { IS_WINDOWS } = require('./platform');

/**
 * Windows CMD uses cp850/cp1252 by default — block-drawing characters
 * (█ ╗ ╔ ═) are not in those code pages and render as garbage.
 * Windows Terminal and PowerShell 7+ support UTF-8, but we can't
 * reliably detect which one we're in, so we use a plain ASCII fallback
 * for all Windows environments.
 *
 * Set HOSTMARGIN_UNICODE=1 to force the fancy banner on any platform.
 */
function printBanner() {
  const forceUnicode = process.env.HOSTMARGIN_UNICODE === '1';
  const useFancy     = !IS_WINDOWS || forceUnicode;

  console.log('');

  if (useFancy) {
    // Unicode block art — Mac, Linux, Windows Terminal
    console.log(chalk.cyan('  ██╗  ██╗ ██████╗ ███████╗████████╗███╗   ███╗ █████╗ ██████╗  ██████╗ ██╗███╗   ██╗'));
    console.log(chalk.cyan('  ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝████╗ ████║██╔══██╗██╔══██╗██╔════╝ ██║████╗  ██║'));
    console.log(chalk.cyan('  ███████║██║   ██║███████╗   ██║   ██╔████╔██║███████║██████╔╝██║  ███╗██║██╔██╗ ██║'));
    console.log(chalk.cyan('  ██╔══██║██║   ██║╚════██║   ██║   ██║╚██╔╝██║██╔══██║██╔══██╗██║   ██║██║██║╚██╗██║'));
    console.log(chalk.cyan('  ██║  ██║╚██████╔╝███████║   ██║   ██║ ╚═╝ ██║██║  ██║██║  ██║╚██████╔╝██║██║ ╚████║'));
    console.log(chalk.cyan('  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝'));
  } else {
    // Plain ASCII — safe in cmd.exe and older PowerShell
    console.log(chalk.cyan('  +--------------------------------------------------+'));
    console.log(chalk.cyan('  |   EXPOSE127  --  instant public tunnel URLs     |'));
    console.log(chalk.cyan('  +--------------------------------------------------+'));
  }

  console.log('');
  console.log(chalk.gray(`  Instant public URLs for your localhost  |  v${config.VERSION}  |  ${config.BASE_DOMAIN}`));
  console.log('');
}

module.exports = { printBanner };
