// Parallel Internet - Template Engine
// Main initializer that ties all components together

const PITemplate = (function() {
  'use strict';

  let config = null;
  let template = null;
  let initialized = false;

  // ============================================
  // INITIALIZATION
  // ============================================

  async function init(options = {}) {
    const {
      containerId = 'pi-app',
      configPath = null,
      configData = null,
      templateId = null,
      onReady = null,
      onSelect = null
    } = options;

    // Load config
    if (configPath) {
      config = await PIConfig.loadFromJSON(configPath);
    } else if (configData) {
      config = PIConfig.loadFromObject(configData);
    } else {
      console.error('[PITemplate] No config provided');
      return false;
    }

    if (!config) {
      console.error('[PITemplate] Failed to load config');
      return false;
    }

    // Get template
    const industry = templateId || config.business.industry || 'generic';
    template = PIConfig.getTemplate(industry);

    // Build DOM
    buildDOM(containerId);

    // Initialize globe
    const globeOk = PIGlobe.init('pi-globe-canvas', {
      baseColor: config.business.secondaryColor || template.colors?.secondary,
      glowColor: config.business.primaryColor || template.colors?.primary,
      cameraZ: 2.8
    });

    // Add markers
    const markers = config.locations.map(loc => ({
      id: loc.id,
      lat: loc.lat,
      lon: loc.lon,
      color: loc.color || config.business.primaryColor,
      ...loc
    }));
    PIGlobe.addMarkers(markers);

    // Initialize panels
    PIPanels.initTooltip('pi-globe-canvas');
    PIPanels.initDetailPanel('pi-globe-canvas');

    // Setup event handlers
    PIGlobe.onMarkerHover((data, event) => {
      if (data) {
        PIPanels.showTooltip(formatTooltipData(data), event);
      } else {
        PIPanels.hideTooltip();
      }
    });

    PIGlobe.onMarkerClick((data, event) => {
      selectLocation(data.id);
      if (onSelect) onSelect(data.id, data);
    });

    // Render sidebar
    renderSidebar();

    // Render ticker
    renderTicker();

    // Update title
    document.getElementById('pi-title').textContent = config.business.name;
    document.getElementById('pi-subtitle').textContent = config.business.tagline || '';

    // Apply colors
    applyTheme();

    initialized = true;

    if (onReady) onReady(config);

    return true;
  }

  // ============================================
  // DOM BUILDING
  // ============================================

  function buildDOM(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[PITemplate] Container not found:', containerId);
      return;
    }

    container.innerHTML = `
      <div class="pi-container">
        <!-- Globe Section -->
        <div class="pi-globe-container">
          <div id="pi-globe-canvas" class="pi-globe-canvas"></div>

          <!-- Overlay Info -->
          <div class="pi-globe-overlay">
            <h1 id="pi-title" class="pi-globe-title"></h1>
            <p id="pi-subtitle" class="pi-globe-subtitle"></p>
          </div>

          <!-- Live Ticker -->
          <div id="pi-ticker" class="pi-ticker"></div>
        </div>

        <!-- Sidebar -->
        <div class="pi-sidebar">
          <div class="pi-sidebar-header">
            <span class="pi-sidebar-title">Locations</span>
            <span id="pi-count" class="pi-count"></span>
          </div>

          <!-- Filters -->
          <div id="pi-filters" class="pi-filters"></div>

          <!-- Card List -->
          <div id="pi-card-list" class="pi-card-list"></div>
        </div>
      </div>
    `;
  }

  // ============================================
  // RENDERING
  // ============================================

  function renderSidebar() {
    // Render filters
    const categories = [...new Set(config.locations.map(l => l.category))];
    const filterContainer = document.getElementById('pi-filters');

    if (categories.length > 1) {
      filterContainer.innerHTML = `
        <button class="pi-filter-pill active" data-filter="all">All</button>
        ${categories.map(cat => `
          <button class="pi-filter-pill" data-filter="${cat}">${cat}</button>
        `).join('')}
      `;

      filterContainer.querySelectorAll('.pi-filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          filterContainer.querySelectorAll('.pi-filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderCardList(btn.dataset.filter);
        });
      });
    }

    // Render cards
    renderCardList('all');

    // Update count
    document.getElementById('pi-count').textContent = `${config.locations.length} locations`;
  }

  function renderCardList(filter = 'all') {
    const items = config.locations.map(loc => formatCardData(loc));
    PIPanels.renderCardList('pi-card-list', items, {
      filter,
      onSelect: (id) => selectLocation(id)
    });
  }

  function renderTicker() {
    const ticker = document.getElementById('pi-ticker');
    if (!ticker) return;

    // Default ticker - templates can override
    const stats = getTickerStats();

    ticker.innerHTML = stats.map(stat => `
      <div class="pi-ticker-item">
        <span class="pi-ticker-label">${stat.label}</span>
        <span class="pi-ticker-value ${stat.class || ''}">${stat.value}</span>
      </div>
    `).join('');
  }

  // ============================================
  // DATA FORMATTING (Override per template)
  // ============================================

  function formatTooltipData(loc) {
    return {
      name: loc.name,
      subtitle: `${loc.city || ''}, ${loc.state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
      icon: '📍',
      color: loc.color,
      stats: [
        { label: 'Status', value: loc.status || 'Active', color: loc.status === 'open' ? '#22c55e' : '#ef4444' }
      ]
    };
  }

  function formatCardData(loc) {
    return {
      id: loc.id,
      name: loc.name,
      subtitle: `${loc.city || ''}, ${loc.state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
      icon: '📍',
      color: loc.color,
      status: loc.status || 'active',
      statusText: loc.status || 'Active',
      category: loc.category,
      stats: []
    };
  }

  function formatDetailData(loc) {
    return {
      ...loc,
      icon: '📍',
      badges: [
        { text: loc.status || 'Active', color: loc.status === 'open' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          textColor: loc.status === 'open' ? '#22c55e' : '#ef4444' },
        { text: loc.category || 'Location' }
      ],
      sections: [],
      actions: []
    };
  }

  function getTickerStats() {
    return [
      { label: 'Total Locations', value: config.locations.length, class: 'primary' },
      { label: 'Active', value: config.locations.filter(l => l.status !== 'closed').length, class: '' }
    ];
  }

  // ============================================
  // SELECTION
  // ============================================

  function selectLocation(id) {
    const loc = config.locations.find(l => l.id === id);
    if (!loc) return;

    // Highlight marker
    PIGlobe.highlightMarker(id);
    PIGlobe.rotateToMarker(id);

    // Show detail panel
    PIPanels.showDetailPanel(formatDetailData(loc));

    // Update card selection
    PIPanels.selectCard(id);
  }

  function clearSelection() {
    PIGlobe.highlightMarker(null);
    PIPanels.hideDetailPanel();
  }

  // ============================================
  // THEMING
  // ============================================

  function applyTheme() {
    const root = document.documentElement;
    const primary = config.business.primaryColor || template.colors?.primary || '#3b82f6';
    const secondary = config.business.secondaryColor || template.colors?.secondary || '#1e40af';

    root.style.setProperty('--pi-primary', primary);
    root.style.setProperty('--pi-secondary', secondary);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    init,
    selectLocation,
    clearSelection,
    renderSidebar,
    renderTicker,

    // Allow templates to override formatters
    setTooltipFormatter: (fn) => { formatTooltipData = fn; },
    setCardFormatter: (fn) => { formatCardData = fn; },
    setDetailFormatter: (fn) => { formatDetailData = fn; },
    setTickerStats: (fn) => { getTickerStats = fn; },

    get config() { return config; },
    get template() { return template; },
    get initialized() { return initialized; }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PITemplate;
}
