const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const TEMPLATES_DIR = path.resolve(__dirname, '../../../src/parallel-internet/templates');

module.exports = async function(sitePath, options) {
  const { as: newName } = options;
  const absolutePath = path.resolve(sitePath);
  const newTemplatePath = path.join(TEMPLATES_DIR, newName);

  console.log(chalk.cyan('\n  Forking site as new template...'));
  console.log(chalk.gray(`  Source: ${absolutePath}`));
  console.log(chalk.gray(`  New template: ${newName}`));

  // Check if source exists
  if (!await fs.pathExists(absolutePath)) {
    console.log(chalk.red(`\n  ✗ Site not found: ${absolutePath}\n`));
    process.exit(1);
  }

  // Check if template name already exists
  if (await fs.pathExists(newTemplatePath)) {
    console.log(chalk.red(`\n  ✗ Template "${newName}" already exists\n`));
    process.exit(1);
  }

  try {
    // Create template directory
    await fs.mkdir(newTemplatePath, { recursive: true });

    // Copy template files (not lib or config)
    const templateDir = path.join(absolutePath, 'template');
    if (await fs.pathExists(templateDir)) {
      await fs.copy(templateDir, newTemplatePath);
    }

    // Copy config as example
    const configPath = path.join(absolutePath, 'config.json');
    if (await fs.pathExists(configPath)) {
      // Read and modify config for template use
      let config = await fs.readJson(configPath);

      // Clear specific business data but keep structure
      config.business.name = 'My Business';
      config.business.tagline = 'Your tagline here';
      config.business.logo = null;

      // Clear location-specific data but keep first as example
      if (config.locations && config.locations.length > 0) {
        config.locations = [config.locations[0]];
        config.locations[0].name = 'Example Location';
        config.locations[0].id = 'example-1';
      }

      await fs.writeJson(path.join(newTemplatePath, 'config.example.json'), config, { spaces: 2 });
    }

    // Update template.js to use new class name
    const templateJs = path.join(newTemplatePath, 'template.js');
    if (await fs.pathExists(templateJs)) {
      let content = await fs.readFile(templateJs, 'utf8');

      // Replace template ID and name
      const className = `PI${newName.charAt(0).toUpperCase() + newName.slice(1).replace(/-/g, '')}`;
      const oldClassMatch = content.match(/const\s+(\w+)\s*=\s*\(function\(\)/);

      if (oldClassMatch) {
        content = content.replace(oldClassMatch[1], className);
        content = content.replace(
          /TEMPLATE_ID\s*=\s*'[^']+'/,
          `TEMPLATE_ID = '${newName}'`
        );
        content = content.replace(
          /TEMPLATE_NAME\s*=\s*'[^']+'/,
          `TEMPLATE_NAME = '${newName.charAt(0).toUpperCase() + newName.slice(1)} Template'`
        );
      }

      await fs.writeFile(templateJs, content);
    }

    console.log(chalk.green(`\n  ✓ Template "${newName}" created`));
    console.log(chalk.gray(`  Location: ${newTemplatePath}`));
    console.log(chalk.gray('\n  Next steps:'));
    console.log(chalk.gray(`    1. Edit ${newTemplatePath}/template.js to customize formatters`));
    console.log(chalk.gray(`    2. Edit ${newTemplatePath}/styles.css to customize theme`));
    console.log(chalk.gray(`    3. Update ${newTemplatePath}/config.example.json with sample data\n`));

  } catch (error) {
    console.log(chalk.red(`\n  ✗ Fork failed: ${error.message}\n`));
    process.exit(1);
  }
};
