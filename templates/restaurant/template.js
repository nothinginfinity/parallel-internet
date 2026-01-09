// Parallel Internet - Restaurant Template
// Coffee shops, restaurants, cafes, bakeries

const PIRestaurant = (function() {
  'use strict';

  // ============================================
  // TEMPLATE CONFIG
  // ============================================

  const TEMPLATE_ID = 'restaurant';
  const TEMPLATE_NAME = 'Restaurant / Food Service';
  const TEMPLATE_ICON = '🍽️';

  const DEFAULT_COLORS = {
    primary: '#d97706',    // Honey orange
    secondary: '#92400e',  // Deep brown
    accent: '#fbbf24'      // Light amber
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  function isLocationOpen(loc) {
    if (!loc.hours) return null;
    const now = new Date();
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[now.getDay()];
    const hours = loc.hours[today];
    if (!hours || hours === 'Closed') return false;

    const [open, close] = hours.split(' - ').map(t => {
      const [time, period] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    });

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes >= open && nowMinutes <= close;
  }

  function getTodayHours(loc) {
    if (!loc.hours) return 'Hours not available';
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[new Date().getDay()];
    return loc.hours[today] || 'Closed';
  }

  function getAvgRating(loc) {
    if (!loc.reviews) return null;
    const ratings = [];
    if (loc.reviews.yelp?.rating) ratings.push(loc.reviews.yelp.rating);
    if (loc.reviews.google?.rating) ratings.push(loc.reviews.google.rating);
    if (ratings.length === 0) return null;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  }

  function getTotalReviews(loc) {
    if (!loc.reviews) return 0;
    return (loc.reviews.yelp?.count || 0) + (loc.reviews.google?.count || 0);
  }

  // ============================================
  // FORMATTERS
  // ============================================

  function formatTooltipData(loc) {
    const isOpen = isLocationOpen(loc);
    const todayHours = getTodayHours(loc);
    const avgRating = getAvgRating(loc);

    return {
      name: loc.name,
      subtitle: `${loc.city}, ${loc.state}`,
      icon: '☕',
      color: loc.color,
      stats: [
        {
          label: isOpen ? 'Open' : 'Closed',
          value: todayHours.split(' - ')[1] || 'Closed',
          color: isOpen ? '#22c55e' : '#ef4444'
        },
        avgRating ? { label: 'Rating', value: `⭐ ${avgRating}`, color: '#fbbf24' } : null
      ].filter(Boolean)
    };
  }

  function formatCardData(loc) {
    const isOpen = isLocationOpen(loc);
    const avgRating = getAvgRating(loc);
    const totalReviews = getTotalReviews(loc);
    const todayHours = getTodayHours(loc);

    return {
      id: loc.id,
      name: loc.name,
      subtitle: `${loc.city}, ${loc.state}`,
      icon: '☕',
      color: loc.color,
      status: isOpen ? 'open' : 'closed',
      statusText: isOpen ? 'Open' : 'Closed',
      category: loc.category,
      stats: [
        { label: 'Rating', value: avgRating ? `⭐ ${avgRating}` : '--', color: '#fbbf24' },
        { label: 'Reviews', value: totalReviews || '--' },
        { label: 'Closes', value: todayHours.split(' - ')[1] || '--', color: isOpen ? '#22c55e' : '#ef4444' }
      ]
    };
  }

  function formatDetailData(loc) {
    const isOpen = isLocationOpen(loc);
    const todayHours = getTodayHours(loc);
    const popularItems = (loc.menu || []).filter(item => item.popular).slice(0, 5);

    const sections = [];

    // Hours & Contact
    sections.push({
      title: 'Hours & Contact',
      content: `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.5);">Today</span>
          <span style="color: ${isOpen ? '#22c55e' : '#ef4444'}; font-weight: 600;">${todayHours}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: rgba(255,255,255,0.5);">Phone</span>
          <a href="tel:${loc.phone?.replace(/[^0-9]/g, '')}" style="color: #3b82f6; text-decoration: none;">${loc.phone || '--'}</a>
        </div>
      `
    });

    // Menu highlights
    if (popularItems.length > 0) {
      sections.push({
        title: 'Popular Items',
        content: popularItems.map(item => `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span>${item.name}</span>
            <span style="color: #d97706; font-weight: 600;">$${item.price?.toFixed(2) || '--'}</span>
          </div>
        `).join('')
      });
    }

    // Reviews
    if (loc.reviews) {
      sections.push({
        title: 'Reviews',
        content: `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            ${loc.reviews.yelp ? `
              <div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Yelp</div>
                <div style="font-size: 18px; font-weight: 700; color: #ef4444;">⭐ ${loc.reviews.yelp.rating}</div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.4);">${loc.reviews.yelp.count} reviews</div>
              </div>
            ` : ''}
            ${loc.reviews.google ? `
              <div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Google</div>
                <div style="font-size: 18px; font-weight: 700; color: #4285f4;">⭐ ${loc.reviews.google.rating}</div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.4);">${loc.reviews.google.count} reviews</div>
              </div>
            ` : ''}
          </div>
        `
      });
    }

    // Actions
    const actions = [];
    if (loc.links?.directions) {
      actions.push({ label: 'Directions', icon: '📍', url: loc.links.directions });
    }
    if (loc.links?.yelp) {
      actions.push({ label: 'Yelp', icon: '⭐', url: loc.links.yelp });
    }
    if (loc.links?.doordash) {
      actions.push({ label: 'Order', icon: '🛵', url: loc.links.doordash, primary: true });
    }

    return {
      ...loc,
      icon: '☕',
      subtitle: `${loc.address}\n${loc.city}, ${loc.state} ${loc.zip}`,
      badges: [
        {
          text: isOpen ? 'OPEN' : 'CLOSED',
          color: isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          textColor: isOpen ? '#22c55e' : '#ef4444'
        },
        { text: loc.category?.toUpperCase() || 'LOCATION' }
      ],
      sections,
      actions
    };
  }

  function getTickerStats(config) {
    const locations = config.locations || [];
    const totalReviews = locations.reduce((sum, loc) => sum + getTotalReviews(loc), 0);
    const avgRatings = locations.map(loc => getAvgRating(loc)).filter(Boolean);
    const overallRating = avgRatings.length > 0
      ? (avgRatings.reduce((a, b) => a + parseFloat(b), 0) / avgRatings.length).toFixed(1)
      : '--';
    const openCount = locations.filter(loc => isLocationOpen(loc)).length;

    return [
      { label: 'Total Reviews', value: totalReviews.toLocaleString() },
      { label: 'Avg Rating', value: `⭐ ${overallRating}`, class: 'warning' },
      { label: 'Open Now', value: `${openCount}/${locations.length}`, class: openCount > 0 ? '' : 'warning' },
      { label: 'Locations', value: locations.length, class: 'primary' }
    ];
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function apply() {
    // Set custom formatters
    PITemplate.setTooltipFormatter(formatTooltipData);
    PITemplate.setCardFormatter(formatCardData);
    PITemplate.setDetailFormatter(formatDetailData);
    PITemplate.setTickerStats(() => getTickerStats(PITemplate.config));

    // Set custom panel renderers if needed
    // PIPanels.setTooltipRenderer(customRenderer);
  }

  // ============================================
  // PUBLIC API
  // ============================================

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
    isLocationOpen,
    getTodayHours,
    getAvgRating,
    getTotalReviews
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PIRestaurant;
}
