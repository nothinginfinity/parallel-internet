// Parallel Internet - Retail Template
// Stores, franchises, showrooms

const PIRetail = (function() {
  'use strict';

  const TEMPLATE_ID = 'retail';
  const TEMPLATE_NAME = 'Retail / Franchise';
  const TEMPLATE_ICON = '🏪';

  const DEFAULT_COLORS = {
    primary: '#10b981',
    secondary: '#047857',
    accent: '#34d399'
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  function isStoreOpen(store) {
    if (!store.hours) return null;
    const now = new Date();
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[now.getDay()];
    const hours = store.hours[today];
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

  function getTodayHours(store) {
    if (!store.hours) return 'Hours not available';
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[new Date().getDay()];
    return store.hours[today] || 'Closed';
  }

  function getInventoryStatus(store) {
    if (!store.inventory) return { status: 'unknown', color: '#6b7280' };
    const { inStock, lowStock } = store.inventory;
    if (lowStock > 10) return { status: 'Low Stock', color: '#f59e0b' };
    if (inStock > 100) return { status: 'Well Stocked', color: '#22c55e' };
    return { status: 'Normal', color: '#3b82f6' };
  }

  // ============================================
  // FORMATTERS
  // ============================================

  function formatTooltipData(store) {
    const isOpen = isStoreOpen(store);
    const inventory = getInventoryStatus(store);

    return {
      name: store.name,
      subtitle: `${store.city}, ${store.state}`,
      icon: '🏪',
      color: store.color,
      stats: [
        {
          label: isOpen ? 'Open' : 'Closed',
          value: getTodayHours(store).split(' - ')[1] || 'Closed',
          color: isOpen ? '#22c55e' : '#ef4444'
        },
        { label: 'Stock', value: inventory.status, color: inventory.color }
      ]
    };
  }

  function formatCardData(store) {
    const isOpen = isStoreOpen(store);
    const inventory = getInventoryStatus(store);

    return {
      id: store.id,
      name: store.name,
      subtitle: `${store.city}, ${store.state}`,
      icon: '🏪',
      color: store.color,
      status: isOpen ? 'open' : 'closed',
      statusText: isOpen ? 'Open' : 'Closed',
      category: store.category,
      stats: [
        { label: 'Type', value: store.storeType || 'Standard' },
        { label: 'Stock', value: inventory.status, color: inventory.color },
        { label: 'Closes', value: getTodayHours(store).split(' - ')[1] || '--' }
      ]
    };
  }

  function formatDetailData(store) {
    const isOpen = isStoreOpen(store);
    const inventory = getInventoryStatus(store);
    const sections = [];

    // Hours & Contact
    sections.push({
      title: 'Hours & Contact',
      content: `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: rgba(255,255,255,0.5);">Today</span>
          <span style="color: ${isOpen ? '#22c55e' : '#ef4444'}; font-weight: 600;">${getTodayHours(store)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: rgba(255,255,255,0.5);">Phone</span>
          <a href="tel:${store.phone?.replace(/[^0-9]/g, '')}" style="color: #3b82f6; text-decoration: none;">${store.phone || '--'}</a>
        </div>
      `
    });

    // Inventory Status
    if (store.inventory) {
      sections.push({
        title: 'Inventory',
        content: `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <div style="font-size: 10px; color: rgba(255,255,255,0.5);">In Stock</div>
              <div style="font-size: 20px; font-weight: 700; color: #22c55e;">${store.inventory.inStock || 0}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Low Stock</div>
              <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${store.inventory.lowStock || 0}</div>
            </div>
          </div>
        `
      });
    }

    // Categories
    if (store.categories && store.categories.length > 0) {
      sections.push({
        title: 'Departments',
        content: `
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${store.categories.map(cat => `
              <span style="padding: 3px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px;">${cat}</span>
            `).join('')}
          </div>
        `
      });
    }

    const actions = [];
    if (store.links?.directions) {
      actions.push({ label: 'Directions', icon: '📍', url: store.links.directions });
    }
    if (store.links?.website) {
      actions.push({ label: 'Website', icon: '🌐', url: store.links.website });
    }

    return {
      ...store,
      icon: '🏪',
      subtitle: `${store.address}\n${store.city}, ${store.state} ${store.zip}`,
      badges: [
        {
          text: isOpen ? 'OPEN' : 'CLOSED',
          color: isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          textColor: isOpen ? '#22c55e' : '#ef4444'
        },
        { text: store.storeType?.toUpperCase() || 'STORE' }
      ],
      sections,
      actions
    };
  }

  function getTickerStats(config) {
    const stores = config.locations || [];
    const totalInventory = stores.reduce((sum, s) => sum + (s.inventory?.inStock || 0), 0);
    const lowStockCount = stores.reduce((sum, s) => sum + (s.inventory?.lowStock || 0), 0);
    const openCount = stores.filter(s => isStoreOpen(s)).length;

    return [
      { label: 'Total Inventory', value: totalInventory.toLocaleString() },
      { label: 'Low Stock Items', value: lowStockCount, class: lowStockCount > 20 ? 'warning' : '' },
      { label: 'Open Now', value: `${openCount}/${stores.length}` },
      { label: 'Stores', value: stores.length, class: 'primary' }
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
  module.exports = PIRetail;
}
