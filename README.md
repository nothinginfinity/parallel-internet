# Parallel Internet

A 3D globe dashboard for visualizing global data with AI-powered contextual chat. Built with vanilla JavaScript and Three.js.

![Parallel Internet Demo](https://via.placeholder.com/800x400?text=Parallel+Internet+Globe+Dashboard)

## Features

- **3D Interactive Globe** - Visualize data points on a rotating, interactive globe
- **Bidirectional Hover** - Hover cards to highlight markers, hover markers to highlight cards
- **AI-Powered Chat** - Ask questions about your data with context-aware responses
- **Industry Templates** - 8 ready-to-use templates for different business verticals
- **CLI Tool** - Quickly scaffold new projects with `pi-builder`

## Quick Start

```bash
# Clone the repo
git clone https://github.com/nothinginfinity/parallel-internet.git
cd parallel-internet

# Install dependencies
npm install

# Run the demo
npm run dev
# Open http://localhost:3000
```

## Templates

Create a new project from a template:

```bash
# List available templates
npm run templates

# Create a new project
npx pi-builder new my-dashboard --template tech

# Available templates:
# - tech (LLM providers - default)
# - restaurant (multi-location restaurants)
# - retail (store network)
# - realestate (property listings)
# - healthcare (hospital network)
# - logistics (fleet tracking)
# - events (venue management)
# - education (campus network)
```

## Usage

### Standalone HTML

```html
<link rel="stylesheet" href="parallel-internet.css">
<script src="three.min.js"></script>
<script src="parallel-internet.js"></script>

<div id="pi-container">
  <div id="globe-section" class="globe-container">
    <div id="globe-canvas-container" class="globe-canvas"></div>
  </div>
  <div id="providers-list"></div>
</div>
```

### API

```javascript
// Get all providers/data points
const providers = window.parallelInternet.getProviders();

// Select a provider programmatically
window.parallelInternet.selectProvider('anthropic', true);

// Get current data context (for chat integration)
const context = window.parallelInternet.getDataContext();
// Returns: { templateType, providers, selectedProvider, stats, ... }

// Highlight a marker (for external hover events)
window.parallelInternet.highlightMarker('openai');
window.parallelInternet.unhighlightMarker('openai');
```

## Customization

### Data Format

Each data point requires:

```javascript
{
  id: 'unique-id',
  name: 'Display Name',
  logo: 'A',  // Single letter or emoji
  color: '#3b82f6',
  status: 'online',  // online | degraded | offline
  location: { lat: 37.7749, lon: -122.4194 },
  category: 'frontend',  // For filtering
  // ... additional fields for your use case
}
```

### Styling

Override CSS variables:

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --accent-primary: #3b82f6;
  --text-primary: #ffffff;
}
```

## Project Structure

```
parallel-internet/
├── src/
│   ├── parallel-internet.js   # Main module
│   └── parallel-internet.css  # Styles
├── cli/
│   └── index.js               # pi-builder CLI
├── templates/
│   ├── tech.js                # LLM providers (default)
│   ├── restaurant.js
│   ├── retail.js
│   └── ...                    # 8 industry templates
├── public/
│   ├── index.html             # Demo page
│   └── lib/three.min.js       # Three.js bundle
└── package.json
```

## License

MIT
