// Parallel Internet - Events Template
// Venues, festivals, concerts

const PIEvents = (function() {
  'use strict';

  const TEMPLATE_ID = 'events';
  const TEMPLATE_NAME = 'Events / Entertainment';
  const TEMPLATE_ICON = '🎭';

  const DEFAULT_COLORS = {
    primary: '#ec4899',
    secondary: '#be185d',
    accent: '#f472b6'
  };

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTooltipData(venue) {
    return {
      name: venue.name,
      subtitle: `${venue.city}, ${venue.state}`,
      icon: '🎭',
      color: venue.color,
      stats: [
        { label: 'Capacity', value: venue.capacity?.toLocaleString() || '--' },
        { label: 'Next Event', value: venue.nextEvent?.name?.substring(0, 15) || 'None' }
      ]
    };
  }

  function formatCardData(venue) {
    const hasUpcoming = venue.nextEvent && new Date(venue.nextEvent.date) > new Date();

    return {
      id: venue.id,
      name: venue.name,
      subtitle: `${venue.city}, ${venue.state}`,
      icon: '🎭',
      color: venue.color,
      status: hasUpcoming ? 'upcoming' : 'idle',
      statusText: hasUpcoming ? 'Upcoming' : 'No Events',
      category: venue.venueType,
      stats: [
        { label: 'Capacity', value: venue.capacity?.toLocaleString() || '--' },
        { label: 'Next', value: venue.nextEvent ? formatDate(venue.nextEvent.date) : '--' },
        { label: 'Type', value: venue.venueType || '--' }
      ]
    };
  }

  function formatDetailData(venue) {
    const sections = [];

    sections.push({
      title: 'Venue Info',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Capacity</div>
            <div style="font-size: 24px; font-weight: 700; color: #ec4899;">${venue.capacity?.toLocaleString() || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Type</div>
            <div style="font-size: 20px; font-weight: 600; color: #f472b6;">${venue.venueType || '--'}</div>
          </div>
        </div>
      `
    });

    if (venue.nextEvent) {
      sections.push({
        title: 'Next Event',
        content: `
          <div style="padding: 12px; background: rgba(236,72,153,0.1); border-radius: 8px; margin-bottom: 8px;">
            <div style="font-size: 14px; font-weight: 700; color: #f472b6;">${venue.nextEvent.name}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px;">${formatDate(venue.nextEvent.date)}</div>
            ${venue.nextEvent.ticketsAvailable !== undefined ? `
              <div style="margin-top: 8px; display: flex; justify-content: space-between;">
                <span style="font-size: 11px; color: rgba(255,255,255,0.5);">Tickets Available</span>
                <span style="font-size: 11px; font-weight: 600; color: ${venue.nextEvent.ticketsAvailable > 100 ? '#22c55e' : '#f59e0b'};">${venue.nextEvent.ticketsAvailable.toLocaleString()}</span>
              </div>
            ` : ''}
            ${venue.nextEvent.price ? `
              <div style="margin-top: 4px; display: flex; justify-content: space-between;">
                <span style="font-size: 11px; color: rgba(255,255,255,0.5);">Starting Price</span>
                <span style="font-size: 11px; font-weight: 600;">$${venue.nextEvent.price}</span>
              </div>
            ` : ''}
          </div>
        `
      });
    }

    if (venue.amenities && venue.amenities.length > 0) {
      sections.push({
        title: 'Amenities',
        content: `
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${venue.amenities.map(a => `
              <span style="padding: 3px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px;">${a}</span>
            `).join('')}
          </div>
        `
      });
    }

    const actions = [];
    if (venue.links?.tickets) {
      actions.push({ label: 'Buy Tickets', icon: '🎫', url: venue.links.tickets, primary: true });
    }
    if (venue.links?.seating) {
      actions.push({ label: 'Seating Chart', icon: '🪑', url: venue.links.seating });
    }
    if (venue.links?.directions) {
      actions.push({ label: 'Directions', icon: '📍', url: venue.links.directions });
    }

    return {
      ...venue,
      icon: '🎭',
      subtitle: `${venue.address}\n${venue.city}, ${venue.state} ${venue.zip}`,
      badges: [
        {
          text: venue.nextEvent ? 'UPCOMING EVENT' : 'NO EVENTS',
          color: venue.nextEvent ? 'rgba(236,72,153,0.2)' : 'rgba(107,114,128,0.2)',
          textColor: venue.nextEvent ? '#ec4899' : '#6b7280'
        },
        { text: venue.venueType?.toUpperCase() || 'VENUE' }
      ],
      sections,
      actions
    };
  }

  function getTickerStats(config) {
    const venues = config.locations || [];
    const totalCapacity = venues.reduce((sum, v) => sum + (v.capacity || 0), 0);
    const upcomingEvents = venues.filter(v => v.nextEvent && new Date(v.nextEvent.date) > new Date()).length;
    const totalTicketsAvailable = venues.reduce((sum, v) => sum + (v.nextEvent?.ticketsAvailable || 0), 0);

    return [
      { label: 'Total Capacity', value: totalCapacity.toLocaleString(), class: 'primary' },
      { label: 'Upcoming Events', value: upcomingEvents },
      { label: 'Tickets Available', value: totalTicketsAvailable.toLocaleString() },
      { label: 'Venues', value: venues.length }
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
  module.exports = PIEvents;
}
