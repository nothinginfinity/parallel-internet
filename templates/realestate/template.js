// Parallel Internet - Real Estate Template
// Properties, listings, developments

const PIRealestate = (function() {
  'use strict';

  const TEMPLATE_ID = 'realestate';
  const TEMPLATE_NAME = 'Real Estate';
  const TEMPLATE_ICON = '🏠';

  const DEFAULT_COLORS = {
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    accent: '#a78bfa'
  };

  function formatPrice(price) {
    if (!price) return '--';
    if (price >= 1000000) return '$' + (price / 1000000).toFixed(1) + 'M';
    if (price >= 1000) return '$' + (price / 1000).toFixed(0) + 'K';
    return '$' + price.toLocaleString();
  }

  function formatTooltipData(property) {
    return {
      name: property.name,
      subtitle: `${property.city}, ${property.state}`,
      icon: '🏠',
      color: property.color,
      stats: [
        { label: 'Price', value: formatPrice(property.price), color: '#8b5cf6' },
        { label: 'Type', value: property.propertyType || 'Property' },
        { label: 'Sqft', value: property.sqft?.toLocaleString() || '--' }
      ]
    };
  }

  function formatCardData(property) {
    return {
      id: property.id,
      name: property.name,
      subtitle: `${property.city}, ${property.state}`,
      icon: '🏠',
      color: property.color,
      status: property.status || 'active',
      statusText: property.status === 'sold' ? 'Sold' : property.status === 'pending' ? 'Pending' : 'Active',
      category: property.propertyType,
      stats: [
        { label: 'Price', value: formatPrice(property.price), color: '#8b5cf6' },
        { label: 'Sqft', value: property.sqft?.toLocaleString() || '--' },
        { label: 'Beds', value: property.beds || '--' }
      ]
    };
  }

  function formatDetailData(property) {
    const sections = [];

    sections.push({
      title: 'Property Details',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Bedrooms</div>
            <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${property.beds || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Bathrooms</div>
            <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${property.baths || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Square Feet</div>
            <div style="font-size: 20px; font-weight: 700; color: #a78bfa;">${property.sqft?.toLocaleString() || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Year Built</div>
            <div style="font-size: 20px; font-weight: 700; color: #a78bfa;">${property.yearBuilt || '--'}</div>
          </div>
        </div>
      `
    });

    sections.push({
      title: 'Pricing',
      content: `
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div style="font-size: 24px; font-weight: 700; color: #8b5cf6;">${formatPrice(property.price)}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.5);">
            $${property.sqft ? Math.round(property.price / property.sqft).toLocaleString() : '--'}/sqft
          </div>
        </div>
        ${property.daysOnMarket ? `<div style="margin-top: 8px; font-size: 11px; color: rgba(255,255,255,0.5);">${property.daysOnMarket} days on market</div>` : ''}
      `
    });

    if (property.features && property.features.length > 0) {
      sections.push({
        title: 'Features',
        content: `
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${property.features.map(f => `
              <span style="padding: 3px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px;">${f}</span>
            `).join('')}
          </div>
        `
      });
    }

    if (property.agent) {
      sections.push({
        title: 'Agent',
        content: `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: rgba(139,92,246,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">👤</div>
            <div>
              <div style="font-weight: 600;">${property.agent.name}</div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.5);">${property.agent.phone || property.agent.email}</div>
            </div>
          </div>
        `
      });
    }

    const actions = [];
    if (property.links?.tour) {
      actions.push({ label: 'Virtual Tour', icon: '🎥', url: property.links.tour, primary: true });
    }
    if (property.links?.directions) {
      actions.push({ label: 'Directions', icon: '📍', url: property.links.directions });
    }

    return {
      ...property,
      icon: '🏠',
      subtitle: `${property.address}\n${property.city}, ${property.state} ${property.zip}`,
      badges: [
        {
          text: property.status === 'sold' ? 'SOLD' : property.status === 'pending' ? 'PENDING' : 'FOR SALE',
          color: property.status === 'sold' ? 'rgba(239,68,68,0.2)' : property.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)',
          textColor: property.status === 'sold' ? '#ef4444' : property.status === 'pending' ? '#f59e0b' : '#8b5cf6'
        },
        { text: property.propertyType?.toUpperCase() || 'PROPERTY' }
      ],
      sections,
      actions
    };
  }

  function getTickerStats(config) {
    const properties = config.locations || [];
    const avgPrice = properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length
      : 0;
    const avgDays = properties.filter(p => p.daysOnMarket).length > 0
      ? properties.reduce((sum, p) => sum + (p.daysOnMarket || 0), 0) / properties.filter(p => p.daysOnMarket).length
      : 0;
    const activeCount = properties.filter(p => p.status !== 'sold').length;

    return [
      { label: 'Avg. Price', value: formatPrice(avgPrice), class: 'primary' },
      { label: 'Avg. Days on Market', value: Math.round(avgDays) || '--' },
      { label: 'Active Listings', value: activeCount },
      { label: 'Total Properties', value: properties.length }
    ];
  }

  function apply() {
    PITemplate.setTooltipFormatter(formatTooltipData);
    PITemplate.setCardFormatter(formatCardData);
    PITemplate.setDetailFormatter(formatDetailData);
    PITemplate.setTickerStats(() => getTickerStats(PITemplate.config));
  }

  return {
    TEMPLATE_ID,
    TEMPLATE_NAME,
    TEMPLATE_ICON,
    DEFAULT_COLORS,
    apply,
    formatTooltipData,
    formatCardData,
    formatDetailData,
    getTickerStats,
    formatPrice
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PIRealestate;
}
