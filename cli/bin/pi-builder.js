#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');

// Commands
const newCmd = require('../commands/new');
const templatesCmd = require('../commands/templates');
const previewCmd = require('../commands/preview');
const exportCmd = require('../commands/export');
const forkCmd = require('../commands/fork');

const VERSION = '1.0.0';

console.log(chalk.blue.bold('\n  PI Builder') + chalk.gray(` v${VERSION}\n`));

program
  .name('pi-builder')
  .description('Parallel Internet Site Builder - Generate customized 3D globe dashboards')
  .version(VERSION);

// pi-builder new
program
  .command('new')
  .description('Create a new site from a template')
  .requiredOption('-t, --template <type>', 'Template type (restaurant, tech, retail, realestate, healthcare, logistics, events, education)')
  .requiredOption('-n, --name <name>', 'Site name (used for output directory)')
  .option('-c, --config <path>', 'Path to business config JSON file')
  .option('-m, --mode <mode>', 'Deployment mode: local or cdn', 'local')
  .option('-o, --output <path>', 'Output directory', './sites')
  .action(newCmd);

// pi-builder templates
program
  .command('templates')
  .description('List available templates')
  .option('-v, --verbose', 'Show detailed template info')
  .action(templatesCmd);

// pi-builder preview
program
  .command('preview <sitePath>')
  .description('Start local development server for a site')
  .option('-p, --port <port>', 'Server port', '8080')
  .action(previewCmd);

// pi-builder export
program
  .command('export <sitePath>')
  .description('Bundle site for deployment')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-m, --mode <mode>', 'Deployment mode: local or cdn', 'local')
  .option('--minify', 'Minify JavaScript and CSS')
  .action(exportCmd);

// pi-builder fork
program
  .command('fork <sitePath>')
  .description('Fork a site as a new template')
  .requiredOption('--as <name>', 'New template name')
  .action(forkCmd);

program.parse();
