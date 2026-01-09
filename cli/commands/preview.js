const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

module.exports = async function(sitePath, options) {
  const { port } = options;
  const absolutePath = path.resolve(sitePath);

  // Check if site exists
  if (!await fs.pathExists(absolutePath)) {
    console.log(chalk.red(`\n  ✗ Site not found: ${absolutePath}\n`));
    process.exit(1);
  }

  // Check if index.html exists
  if (!await fs.pathExists(path.join(absolutePath, 'index.html'))) {
    console.log(chalk.red(`\n  ✗ No index.html found in ${absolutePath}\n`));
    console.log(chalk.gray('    Make sure this is a valid PI Builder site\n'));
    process.exit(1);
  }

  console.log(chalk.cyan('\n  Starting preview server...\n'));
  console.log(chalk.white(`  Site: ${absolutePath}`));
  console.log(chalk.white(`  URL:  http://localhost:${port}`));
  console.log(chalk.gray('\n  Press Ctrl+C to stop\n'));

  // Try to use http-server, fall back to Python if not available
  try {
    const httpServer = spawn('npx', ['http-server', absolutePath, '-p', port, '-c-1', '--cors'], {
      stdio: 'inherit'
    });

    httpServer.on('error', (error) => {
      console.log(chalk.yellow('  npx http-server not available, trying Python...'));
      startPythonServer(absolutePath, port);
    });

  } catch (error) {
    startPythonServer(absolutePath, port);
  }
};

function startPythonServer(sitePath, port) {
  const python = spawn('python3', ['-m', 'http.server', port], {
    cwd: sitePath,
    stdio: 'inherit'
  });

  python.on('error', (error) => {
    console.log(chalk.red(`\n  ✗ Could not start server: ${error.message}`));
    console.log(chalk.gray('    Make sure Python 3 is installed\n'));
    process.exit(1);
  });
}
