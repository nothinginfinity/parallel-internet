const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const TEMPLATES_DIR = path.resolve(__dirname, '../../../src/parallel-internet/templates');
const PUBLIC_LIB_DIR = path.resolve(__dirname, '../../../public/lib');

module.exports = async function(options) {
  const { template, name, config, mode, output } = options;

  console.log(chalk.cyan('  Creating new site...'));
  console.log(chalk.gray(`  Template: ${template}`));
  console.log(chalk.gray(`  Name: ${name}`));
  console.log(chalk.gray(`  Mode: ${mode}`));

  // Validate template exists
  const templateDir = path.join(TEMPLATES_DIR, template);
  if (!await fs.pathExists(templateDir)) {
    console.log(chalk.red(`\n  ✗ Template "${template}" not found`));
    console.log(chalk.gray(`    Available: restaurant, tech, retail, realestate, healthcare, logistics, events, education\n`));
    process.exit(1);
  }

  // Create site directory
  const sitePath = path.resolve(output, name);
  if (await fs.pathExists(sitePath)) {
    console.log(chalk.yellow(`\n  ⚠ Directory "${sitePath}" already exists`));
    console.log(chalk.gray('    Use a different name or delete the existing directory\n'));
    process.exit(1);
  }

  try {
    await fs.mkdir(sitePath, { recursive: true });
    await fs.mkdir(path.join(sitePath, 'lib'), { recursive: true });
    await fs.mkdir(path.join(sitePath, 'template'), { recursive: true });
    await fs.mkdir(path.join(sitePath, 'assets'), { recursive: true });

    // Copy base components
    console.log(chalk.gray('  Copying base components...'));
    await fs.copy(path.join(TEMPLATES_DIR, '_base'), path.join(sitePath, 'lib'));

    // Copy template-specific files
    console.log(chalk.gray('  Copying template files...'));
    await fs.copy(templateDir, path.join(sitePath, 'template'));

    // Copy or load config
    if (config) {
      console.log(chalk.gray('  Copying config...'));
      await fs.copy(config, path.join(sitePath, 'config.json'));
    } else {
      // Use example config from template
      const exampleConfig = path.join(templateDir, 'config.example.json');
      if (await fs.pathExists(exampleConfig)) {
        await fs.copy(exampleConfig, path.join(sitePath, 'config.json'));
      }
    }

    // Bundle dependencies if local mode
    if (mode === 'local') {
      console.log(chalk.gray('  Bundling dependencies (local mode)...'));
      const threePath = path.join(PUBLIC_LIB_DIR, 'three.min.js');
      const d3Path = path.join(PUBLIC_LIB_DIR, 'd3.v7.min.js');

      if (await fs.pathExists(threePath)) {
        await fs.copy(threePath, path.join(sitePath, 'lib', 'three.min.js'));
      }
      if (await fs.pathExists(d3Path)) {
        await fs.copy(d3Path, path.join(sitePath, 'lib', 'd3.v7.min.js'));
      }
    }

    // Generate index.html
    console.log(chalk.gray('  Generating index.html...'));
    const html = generateHTML(template, name, mode);
    await fs.writeFile(path.join(sitePath, 'index.html'), html);

    console.log(chalk.green(`\n  ✓ Site created at ${sitePath}\n`));
    console.log(chalk.white('  Next steps:'));
    console.log(chalk.gray(`    1. Edit ${sitePath}/config.json with your business data`));
    console.log(chalk.gray(`    2. Run: pi-builder preview ${sitePath}`));
    console.log(chalk.gray(`    3. Customize template files in ${sitePath}/template/\n`));

  } catch (error) {
    console.log(chalk.red(`\n  ✗ Error: ${error.message}\n`));
    process.exit(1);
  }
};

function generateHTML(template, name, mode) {
  const threeJsSrc = mode === 'cdn'
    ? 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    : './lib/three.min.js';

  const templateClass = `PI${template.charAt(0).toUpperCase() + template.slice(1)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Powered by PI Builder</title>
  <link rel="stylesheet" href="./lib/styles.css">
  <link rel="stylesheet" href="./template/styles.css">
</head>
<body>
  <div id="pi-app"></div>

  <!-- Dependencies (${mode} mode) -->
  <script src="${threeJsSrc}"></script>

  <!-- PI Builder Core -->
  <script src="./lib/globe.js"></script>
  <script src="./lib/config-loader.js"></script>
  <script src="./lib/panels.js"></script>
  <script src="./lib/pi-template.js"></script>

  <!-- Template: ${template} -->
  <script src="./template/template.js"></script>

  <script>
    // Apply template formatters
    if (typeof ${templateClass} !== 'undefined') {
      ${templateClass}.apply();
    }

    // Initialize with config
    PITemplate.init({
      containerId: 'pi-app',
      configPath: './config.json',
      onReady: (config) => {
        console.log('[${name}] Loaded:', config.business.name);
        document.title = config.business.name + ' - Powered by PI Builder';
      }
    });
  </script>
</body>
</html>`;
}
