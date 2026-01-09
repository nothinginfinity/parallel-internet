const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

module.exports = async function(sitePath, options) {
  const { output, mode, minify } = options;
  const absolutePath = path.resolve(sitePath);
  const outputPath = path.resolve(output);

  console.log(chalk.cyan('\n  Exporting site for deployment...'));
  console.log(chalk.gray(`  Source: ${absolutePath}`));
  console.log(chalk.gray(`  Output: ${outputPath}`));
  console.log(chalk.gray(`  Mode: ${mode}`));

  // Check if source exists
  if (!await fs.pathExists(absolutePath)) {
    console.log(chalk.red(`\n  ✗ Site not found: ${absolutePath}\n`));
    process.exit(1);
  }

  try {
    // Create output directory
    await fs.mkdir(outputPath, { recursive: true });

    // Copy all files
    await fs.copy(absolutePath, outputPath);

    // If switching to CDN mode, update index.html
    if (mode === 'cdn') {
      console.log(chalk.gray('  Updating dependencies to CDN...'));
      const indexPath = path.join(outputPath, 'index.html');
      let html = await fs.readFile(indexPath, 'utf8');

      // Replace local paths with CDN
      html = html.replace(
        /src="\.\/lib\/three\.min\.js"/g,
        'src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"'
      );

      await fs.writeFile(indexPath, html);

      // Remove local three.js to reduce bundle size
      const localThree = path.join(outputPath, 'lib', 'three.min.js');
      if (await fs.pathExists(localThree)) {
        await fs.remove(localThree);
      }
    }

    // TODO: Add minification if --minify flag is set
    if (minify) {
      console.log(chalk.yellow('  Minification not yet implemented'));
    }

    // Calculate bundle size
    const files = await getFilesRecursive(outputPath);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    console.log(chalk.green(`\n  ✓ Export complete`));
    console.log(chalk.gray(`  Files: ${files.length}`));
    console.log(chalk.gray(`  Size: ${formatBytes(totalSize)}\n`));

  } catch (error) {
    console.log(chalk.red(`\n  ✗ Export failed: ${error.message}\n`));
    process.exit(1);
  }
};

async function getFilesRecursive(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFilesRecursive(fullPath));
    } else {
      const stat = await fs.stat(fullPath);
      files.push({ path: fullPath, size: stat.size });
    }
  }

  return files;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
