// Parallel Internet - Healthcare Template
// Clinics, hospitals, pharmacies

const PIHealthcare = (function() {
  'use strict';

  const TEMPLATE_ID = 'healthcare';
  const TEMPLATE_NAME = 'Healthcare';
  const TEMPLATE_ICON = '🏥';

  const DEFAULT_COLORS = {
    primary: '#ef4444',
    secondary: '#b91c1c',
    accent: '#f87171'
  };

  function formatWaitTime(minutes) {
    if (!minutes) return '--';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  function formatTooltipData(facility) {
    return {
      name: facility.name,
      subtitle: `${facility.city}, ${facility.state}`,
      icon: '🏥',
      color: facility.color,
      stats: [
        { label: 'Wait Time', value: formatWaitTime(facility.waitTime), color: facility.waitTime > 30 ? '#f59e0b' : '#22c55e' },
        { label: 'Type', value: facility.facilityType || 'Clinic' }
      ]
    };
  }

  function formatCardData(facility) {
    const waitColor = facility.waitTime > 45 ? '#ef4444' : facility.waitTime > 30 ? '#f59e0b' : '#22c55e';

    return {
      id: facility.id,
      name: facility.name,
      subtitle: `${facility.city}, ${facility.state}`,
      icon: '🏥',
      color: facility.color,
      status: facility.status || 'open',
      statusText: facility.status === 'closed' ? 'Closed' : 'Open',
      category: facility.facilityType,
      stats: [
        { label: 'Wait', value: formatWaitTime(facility.waitTime), color: waitColor },
        { label: 'Rating', value: facility.rating ? `⭐ ${facility.rating}` : '--' },
        { label: 'Type', value: facility.facilityType || '--' }
      ]
    };
  }

  function formatDetailData(facility) {
    const sections = [];

    sections.push({
      title: 'Current Status',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Wait Time</div>
            <div style="font-size: 24px; font-weight: 700; color: ${facility.waitTime > 30 ? '#f59e0b' : '#22c55e'};">${formatWaitTime(facility.waitTime)}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Satisfaction</div>
            <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${facility.satisfaction || '--'}%</div>
          </div>
        </div>
      `
    });

    if (facility.services && facility.services.length > 0) {
      sections.push({
        title: 'Services',
        content: `
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${facility.services.map(s => `
              <span style="padding: 3px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px;">${s}</span>
            `).join('')}
          </div>
        `
      });
    }

    if (facility.insurance && facility.insurance.length > 0) {
      sections.push({
        title: 'Insurance Accepted',
        content: `
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${facility.insurance.map(i => `
              <span style="padding: 3px 8px; background: rgba(239,68,68,0.1); border-radius: 4px; font-size: 10px; color: #f87171;">${i}</span>
            `).join('')}
          </div>
        `
      });
    }

    sections.push({
      title: 'Contact',
      content: `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.5);">Phone</span>
          <a href="tel:${facility.phone?.replace(/[^0-9]/g, '')}" style="color: #ef4444; text-decoration: none;">${facility.phone || '--'}</a>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: rgba(255,255,255,0.5);">Emergency</span>
          <span style="color: ${facility.emergencyRoom ? '#22c55e' : '#6b7280'};">${facility.emergencyRoom ? 'Available' : 'Not Available'}</span>
        </div>
      `
    });

    const actions = [];
    if (facility.links?.booking) {
      actions.push({ label: 'Book Appointment', icon: '📅', url: facility.links.booking, primary: true });
    }
    if (facility.links?.telehealth) {
      actions.push({ label: 'Telehealth', icon: '💻', url: facility.links.telehealth });
    }
    if (facility.links?.directions) {
      actions.push({ label: 'Directions', icon: '📍', url: facility.links.directions });
    }

    return {
      ...facility,
      icon: '🏥',
      subtitle: `${facility.address}\n${facility.city}, ${facility.state} ${facility.zip}`,
      badges: [
        {
          text: facility.status === 'closed' ? 'CLOSED' : 'OPEN',
          color: facility.status === 'closed' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
          textColor: facility.status === 'closed' ? '#ef4444' : '#22c55e'
        },
        { text: facility.facilityType?.toUpperCase() || 'FACILITY' }
      ],
      sections,
      actions
    };
  }

  function getTickerStats(config) {
    const facilities = config.locations || [];
    const avgWait = facilities.filter(f => f.waitTime).length > 0
      ? facilities.reduce((sum, f) => sum + (f.waitTime || 0), 0) / facilities.filter(f => f.waitTime).length
      : 0;
    const avgSatisfaction = facilities.filter(f => f.satisfaction).length > 0
      ? facilities.reduce((sum, f) => sum + (f.satisfaction || 0), 0) / facilities.filter(f => f.satisfaction).length
      : 0;
    const openCount = facilities.filter(f => f.status !== 'closed').length;

    return [
      { label: 'Avg. Wait Time', value: formatWaitTime(Math.round(avgWait)), class: avgWait > 30 ? 'warning' : '' },
      { label: 'Avg. Satisfaction', value: `${Math.round(avgSatisfaction)}%`, class: 'primary' },
      { label: 'Open Facilities', value: `${openCount}/${facilities.length}` },
      { label: 'Total Facilities', value: facilities.length }
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
  module.exports = PIHealthcare;
}
