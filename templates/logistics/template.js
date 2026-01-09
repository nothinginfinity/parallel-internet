// Parallel Internet - Logistics Template
// Delivery, trucking, warehouses

const PILogistics = (function() {
  'use strict';

  const TEMPLATE_ID = 'logistics';
  const TEMPLATE_NAME = 'Logistics / Fleet';
  const TEMPLATE_ICON = '🚚';

  const DEFAULT_COLORS = {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24'
  };

  function formatTooltipData(depot) {
    const utilization = depot.utilization || 0;
    const utilizationColor = utilization > 90 ? '#ef4444' : utilization > 70 ? '#f59e0b' : '#22c55e';

    return {
      name: depot.name,
      subtitle: `${depot.city}, ${depot.state}`,
      icon: '🚚',
      color: depot.color,
      stats: [
        { label: 'Utilization', value: `${utilization}%`, color: utilizationColor },
        { label: 'Vehicles', value: depot.vehicles || '--' },
        { label: 'On-Time', value: depot.onTimeRate ? `${depot.onTimeRate}%` : '--' }
      ]
    };
  }

  function formatCardData(depot) {
    const utilization = depot.utilization || 0;
    const utilizationColor = utilization > 90 ? '#ef4444' : utilization > 70 ? '#f59e0b' : '#22c55e';

    return {
      id: depot.id,
      name: depot.name,
      subtitle: `${depot.city}, ${depot.state}`,
      icon: '🚚',
      color: depot.color,
      status: depot.status || 'active',
      statusText: depot.status === 'offline' ? 'Offline' : 'Active',
      category: depot.depotType,
      stats: [
        { label: 'Vehicles', value: depot.vehicles || '--' },
        { label: 'Utilization', value: `${utilization}%`, color: utilizationColor },
        { label: 'Deliveries', value: depot.dailyDeliveries?.toLocaleString() || '--' }
      ]
    };
  }

  function formatDetailData(depot) {
    const sections = [];

    sections.push({
      title: 'Fleet Status',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Total Vehicles</div>
            <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${depot.vehicles || 0}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">In Transit</div>
            <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${depot.inTransit || 0}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Maintenance</div>
            <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${depot.maintenance || 0}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Available</div>
            <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${depot.available || 0}</div>
          </div>
        </div>
      `
    });

    sections.push({
      title: 'Performance',
      content: `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: rgba(255,255,255,0.5);">On-Time Rate</span>
          <span style="color: ${depot.onTimeRate > 95 ? '#22c55e' : '#f59e0b'}; font-weight: 600;">${depot.onTimeRate || '--'}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: rgba(255,255,255,0.5);">Daily Deliveries</span>
          <span style="font-weight: 600;">${depot.dailyDeliveries?.toLocaleString() || '--'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: rgba(255,255,255,0.5);">Capacity</span>
          <span style="font-weight: 600;">${depot.capacity?.toLocaleString() || '--'} packages</span>
        </div>
      `
    });

    if (depot.routes && depot.routes.length > 0) {
      sections.push({
        title: 'Active Routes',
        content: `
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${depot.routes.map(r => `
              <span style="padding: 3px 8px; background: rgba(245,158,11,0.1); border-radius: 4px; font-size: 10px; color: #fbbf24;">${r}</span>
            `).join('')}
          </div>
        `
      });
    }

    const actions = [];
    if (depot.links?.tracking) {
      actions.push({ label: 'Live Tracking', icon: '📍', url: depot.links.tracking, primary: true });
    }
    if (depot.links?.directions) {
      actions.push({ label: 'Directions', icon: '🗺️', url: depot.links.directions });
    }

    return {
      ...depot,
      icon: '🚚',
      subtitle: `${depot.address}\n${depot.city}, ${depot.state} ${depot.zip}`,
      badges: [
        {
          text: depot.status === 'offline' ? 'OFFLINE' : 'ACTIVE',
          color: depot.status === 'offline' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
          textColor: depot.status === 'offline' ? '#ef4444' : '#22c55e'
        },
        { text: depot.depotType?.toUpperCase() || 'DEPOT' }
      ],
      sections,
      actions
    };
  }

  function getTickerStats(config) {
    const depots = config.locations || [];
    const totalVehicles = depots.reduce((sum, d) => sum + (d.vehicles || 0), 0);
    const totalDeliveries = depots.reduce((sum, d) => sum + (d.dailyDeliveries || 0), 0);
    const avgOnTime = depots.filter(d => d.onTimeRate).length > 0
      ? depots.reduce((sum, d) => sum + (d.onTimeRate || 0), 0) / depots.filter(d => d.onTimeRate).length
      : 0;
    const avgUtilization = depots.filter(d => d.utilization).length > 0
      ? depots.reduce((sum, d) => sum + (d.utilization || 0), 0) / depots.filter(d => d.utilization).length
      : 0;

    return [
      { label: 'Total Vehicles', value: totalVehicles, class: 'primary' },
      { label: 'Daily Deliveries', value: totalDeliveries.toLocaleString() },
      { label: 'Avg. On-Time', value: `${Math.round(avgOnTime)}%`, class: avgOnTime > 95 ? '' : 'warning' },
      { label: 'Avg. Utilization', value: `${Math.round(avgUtilization)}%` }
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
    getTickerStats
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PILogistics;
}
