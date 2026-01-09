// Parallel Internet - Config Loader & Template Engine
// Loads business config and compiles templates

const PIConfig = (function() {
  'use strict';

  let currentConfig = null;
  let currentTemplate = null;

  // ============================================
  // DEFAULT SCHEMA
  // ============================================

  const DEFAULT_CONFIG = {
    business: {
      name: 'My Business',
      tagline: '',
      logo: null,
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      industry: 'generic'
    },
    locations: [],
    custom: {},
    integrations: {},
    vault: {
      enabled: false,
      allowedTypes: ['csv', 'xlsx', 'pdf'],
      maxSize: '50MB'
    },
    chat: {
      enabled: false,
      systemPrompt: '',
      providers: ['groq', 'deepseek']
    },
    ui: {
      showTicker: true,
      showSidebar: true,
      showChat: false,
      showVault: false,
      globeAutoRotate: true
    }
  };

  // ============================================
  // DEPENDENCY CONFIGURATION (Local vs CDN)
  // ============================================

  const DEPENDENCY_CONFIG = {
    mode: 'local',  // 'local' | 'cdn'
    cdn: {
      threejs: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      d3: 'https://d3js.org/d3.v7.min.js'
    },
    local: {
      threejs: './lib/three.min.js',
      d3: './lib/d3.v7.min.js'
    }
  };

  let deploymentMode = 'local';

  function setDeploymentMode(mode) {
    if (mode === 'local' || mode === 'cdn') {
      deploymentMode = mode;
      console.log('[PIConfig] Deployment mode set to:', mode);
    }
  }

  function getDeploymentMode() {
    return deploymentMode;
  }

  function getDependencyPath(lib) {
    const mode = currentConfig?.deployment?.mode || deploymentMode;
    return DEPENDENCY_CONFIG[mode]?.[lib] || DEPENDENCY_CONFIG.local[lib];
  }

  function getDependencies() {
    const mode = currentConfig?.deployment?.mode || deploymentMode;
    return DEPENDENCY_CONFIG[mode];
  }

  // ============================================
  // CONFIG LOADING
  // ============================================

  async function loadFromJSON(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load: ${path}`);
      const config = await response.json();
      return validate(config);
    } catch (error) {
      console.error('[PIConfig] Load error:', error);
      return null;
    }
  }

  function loadFromObject(obj) {
    return validate(obj);
  }

  function validate(config) {
    // Merge with defaults
    const merged = deepMerge(DEFAULT_CONFIG, config);

    // Validate required fields
    if (!merged.business.name) {
      console.warn('[PIConfig] Missing business.name');
    }

    if (!merged.locations || merged.locations.length === 0) {
      console.warn('[PIConfig] No locations defined');
    }

    // Validate locations
    merged.locations = merged.locations.map((loc, i) => ({
      id: loc.id || `location-${i}`,
      name: loc.name || `Location ${i + 1}`,
      lat: loc.lat || 0,
      lon: loc.lon || 0,
      color: loc.color || merged.business.primaryColor,
      ...loc
    }));

    currentConfig = merged;
    return merged;
  }

  function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // ============================================
  // TEMPLATE REGISTRY
  // ============================================

  const TEMPLATES = {
    restaurant: {
      name: 'Restaurant / Food Service',
      description: 'Coffee shops, restaurants, cafes, bakeries',
      icon: '🍽️',
      detailFields: ['hours', 'menu', 'reviews', 'phone'],
      metrics: ['dailySales', 'avgTicket', 'traffic'],
      colors: { primary: '#d97706', secondary: '#92400e' }
    },
    tech: {
      name: 'Tech / AI Companies',
      description: 'SaaS, AI providers, tech startups',
      icon: '💻',
      detailFields: ['products', 'pricing', 'performance', 'docs'],
      metrics: ['usage', 'latency', 'cost'],
      colors: { primary: '#3b82f6', secondary: '#1e40af' }
    },
    retail: {
      name: 'Retail / Franchise',
      description: 'Stores, franchises, showrooms',
      icon: '🏪',
      detailFields: ['hours', 'categories', 'inventory'],
      metrics: ['sales', 'footTraffic', 'inventory'],
      colors: { primary: '#10b981', secondary: '#047857' }
    },
    realestate: {
      name: 'Real Estate',
      description: 'Properties, listings, developments',
      icon: '🏠',
      detailFields: ['price', 'sqft', 'features', 'agent'],
      metrics: ['priceChange', 'daysOnMarket'],
      colors: { primary: '#8b5cf6', secondary: '#6d28d9' }
    },
    healthcare: {
      name: 'Healthcare',
      description: 'Clinics, hospitals, pharmacies',
      icon: '🏥',
      detailFields: ['services', 'hours', 'insurance', 'booking'],
      metrics: ['waitTime', 'satisfaction'],
      colors: { primary: '#ef4444', secondary: '#b91c1c' }
    },
    logistics: {
      name: 'Logistics / Fleet',
      description: 'Delivery, trucking, warehouses',
      icon: '🚚',
      detailFields: ['vehicles', 'routes', 'capacity'],
      metrics: ['deliveries', 'onTime', 'utilization'],
      colors: { primary: '#f59e0b', secondary: '#d97706' }
    },
    events: {
      name: 'Events / Entertainment',
      description: 'Venues, festivals, concerts',
      icon: '🎭',
      detailFields: ['events', 'capacity', 'tickets'],
      metrics: ['ticketSales', 'attendance'],
      colors: { primary: '#ec4899', secondary: '#be185d' }
    },
    education: {
      name: 'Education',
      description: 'Schools, universities, tutoring',
      icon: '🎓',
      detailFields: ['programs', 'faculty', 'enrollment'],
      metrics: ['enrollment', 'graduation'],
      colors: { primary: '#06b6d4', secondary: '#0891b2' }
    }
  };

  function getTemplate(industry) {
    return TEMPLATES[industry] || TEMPLATES.restaurant;
  }

  function listTemplates() {
    return Object.entries(TEMPLATES).map(([key, val]) => ({
      id: key,
      ...val
    }));
  }

  // ============================================
  // DATA HELPERS
  // ============================================

  function getLocations() {
    return currentConfig?.locations || [];
  }

  function getLocation(id) {
    return currentConfig?.locations.find(loc => loc.id === id);
  }

  function getBusiness() {
    return currentConfig?.business || {};
  }

  function getCustomData(key) {
    return currentConfig?.custom?.[key];
  }

  function getIntegration(key) {
    return currentConfig?.integrations?.[key];
  }

  // ============================================
  // EXPORT CONFIG
  // ============================================

  function exportConfig() {
    return JSON.stringify(currentConfig, null, 2);
  }

  function exportForTemplate(templateId) {
    const template = getTemplate(templateId);
    return {
      ...currentConfig,
      _template: templateId,
      _generated: new Date().toISOString()
    };
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    loadFromJSON,
    loadFromObject,
    validate,
    getTemplate,
    listTemplates,
    getLocations,
    getLocation,
    getBusiness,
    getCustomData,
    getIntegration,
    exportConfig,
    exportForTemplate,
    // Dependency config
    setDeploymentMode,
    getDeploymentMode,
    getDependencyPath,
    getDependencies,
    DEPENDENCY_CONFIG,
    // Getters
    get config() { return currentConfig; },
    DEFAULT_CONFIG,
    TEMPLATES
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PIConfig;
}
