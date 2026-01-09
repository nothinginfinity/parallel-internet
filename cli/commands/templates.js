const chalk = require('chalk');

const TEMPLATES = {
  restaurant: {
    name: 'Restaurant / Food Service',
    description: 'Coffee shops, restaurants, cafes, bakeries',
    icon: '🍽️',
    status: 'ready',
    colors: { primary: '#d97706', secondary: '#92400e' }
  },
  tech: {
    name: 'Tech / AI Companies',
    description: 'SaaS, AI providers, tech startups',
    icon: '💻',
    status: 'ready',
    colors: { primary: '#3b82f6', secondary: '#1e40af' }
  },
  retail: {
    name: 'Retail / Franchise',
    description: 'Stores, franchises, showrooms',
    icon: '🏪',
    status: 'ready',
    colors: { primary: '#10b981', secondary: '#047857' }
  },
  realestate: {
    name: 'Real Estate',
    description: 'Properties, listings, developments',
    icon: '🏠',
    status: 'ready',
    colors: { primary: '#8b5cf6', secondary: '#6d28d9' }
  },
  healthcare: {
    name: 'Healthcare',
    description: 'Clinics, hospitals, pharmacies',
    icon: '🏥',
    status: 'ready',
    colors: { primary: '#ef4444', secondary: '#b91c1c' }
  },
  logistics: {
    name: 'Logistics / Fleet',
    description: 'Delivery, trucking, warehouses',
    icon: '🚚',
    status: 'ready',
    colors: { primary: '#f59e0b', secondary: '#d97706' }
  },
  events: {
    name: 'Events / Entertainment',
    description: 'Venues, festivals, concerts',
    icon: '🎭',
    status: 'ready',
    colors: { primary: '#ec4899', secondary: '#be185d' }
  },
  education: {
    name: 'Education',
    description: 'Schools, universities, tutoring',
    icon: '🎓',
    status: 'ready',
    colors: { primary: '#06b6d4', secondary: '#0891b2' }
  }
};

module.exports = function(options) {
  console.log(chalk.white.bold('  Available Templates\n'));

  Object.entries(TEMPLATES).forEach(([id, template]) => {
    const statusColor = template.status === 'ready' ? chalk.green : chalk.yellow;
    const status = template.status === 'ready' ? '✓ ready' : '⏳ coming soon';

    console.log(`  ${template.icon}  ${chalk.bold(id.padEnd(12))} ${template.name}`);

    if (options.verbose) {
      console.log(chalk.gray(`      ${template.description}`));
      console.log(chalk.gray(`      Primary: ${template.colors.primary}  Secondary: ${template.colors.secondary}`));
      console.log(`      Status: ${statusColor(status)}`);
      console.log('');
    }
  });

  if (!options.verbose) {
    console.log(chalk.gray('\n  Use -v for detailed info'));
  }

  console.log(chalk.gray(`\n  Total: ${Object.keys(TEMPLATES).length} templates\n`));
};
