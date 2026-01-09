// Parallel Internet - Panel Components
// Tooltip, Detail Panel, and Sidebar

const PIPanels = (function() {
  'use strict';

  let tooltipEl = null;
  let detailPanelEl = null;
  let selectedId = null;

  // Template functions (override per industry)
  let tooltipRenderer = defaultTooltipRenderer;
  let detailRenderer = defaultDetailRenderer;
  let cardRenderer = defaultCardRenderer;

  // ============================================
  // TOOLTIP
  // ============================================

  function initTooltip(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    tooltipEl = document.createElement('div');
    tooltipEl.id = 'pi-tooltip';
    tooltipEl.className = 'pi-tooltip';
    tooltipEl.style.cssText = `
      position: absolute;
      padding: 10px 14px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      font-size: 12px;
      pointer-events: none;
      z-index: 100;
      display: none;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      max-width: 280px;
    `;
    container.appendChild(tooltipEl);
  }

  function showTooltip(data, event) {
    if (!tooltipEl || !data) {
      hideTooltip();
      return;
    }

    tooltipEl.innerHTML = tooltipRenderer(data);

    const container = tooltipEl.parentElement;
    const containerRect = container.getBoundingClientRect();

    tooltipEl.style.display = 'block';
    tooltipEl.style.left = (event.clientX - containerRect.left + 15) + 'px';
    tooltipEl.style.top = (event.clientY - containerRect.top - 10) + 'px';

    // Keep in bounds
    const tooltipRect = tooltipEl.getBoundingClientRect();
    if (tooltipRect.right > containerRect.right) {
      tooltipEl.style.left = (event.clientX - containerRect.left - tooltipRect.width - 15) + 'px';
    }
    if (tooltipRect.bottom > containerRect.bottom) {
      tooltipEl.style.top = (event.clientY - containerRect.top - tooltipRect.height - 10) + 'px';
    }
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.style.display = 'none';
    }
  }

  function defaultTooltipRenderer(data) {
    return `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 28px; height: 28px; border-radius: 6px; background: ${data.color || '#3b82f6'}30;
                    color: ${data.color || '#3b82f6'}; display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 14px;">${data.icon || '📍'}</div>
        <div>
          <div style="font-weight: 600;">${data.name}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.5);">${data.subtitle || ''}</div>
        </div>
      </div>
      ${data.stats ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
        ${data.stats.map(s => `
          <div><span style="color: rgba(255,255,255,0.5);">${s.label}:</span>
               <span style="color: ${s.color || '#22c55e'};">${s.value}</span></div>
        `).join('')}
      </div>
      ` : ''}
      <div style="margin-top: 8px; font-size: 10px; color: rgba(255,255,255,0.4); text-align: center;">
        Click for details
      </div>
    `;
  }

  // ============================================
  // DETAIL PANEL
  // ============================================

  function initDetailPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    detailPanelEl = document.createElement('div');
    detailPanelEl.id = 'pi-detail-panel';
    detailPanelEl.className = 'pi-detail-panel';
    detailPanelEl.style.cssText = `
      position: absolute;
      top: 80px;
      right: 20px;
      width: 340px;
      max-height: calc(100% - 100px);
      overflow-y: auto;
      background: rgba(10, 10, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 20px;
      color: white;
      z-index: 50;
      display: none;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;
    container.appendChild(detailPanelEl);
  }

  function showDetailPanel(data) {
    if (!detailPanelEl || !data) return;

    selectedId = data.id;
    detailPanelEl.innerHTML = detailRenderer(data);
    detailPanelEl.style.display = 'block';
  }

  function hideDetailPanel() {
    if (detailPanelEl) {
      detailPanelEl.style.display = 'none';
    }
    selectedId = null;
  }

  function defaultDetailRenderer(data) {
    return `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: ${data.color || '#3b82f6'}20;
                      color: ${data.color || '#3b82f6'}; display: flex; align-items: center; justify-content: center;
                      font-size: 24px; border: 2px solid ${data.color || '#3b82f6'}40;">${data.icon || '📍'}</div>
          <div>
            <div style="font-size: 18px; font-weight: 700;">${data.name}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5);">${data.subtitle || ''}</div>
          </div>
        </div>
        <button onclick="PIPanels.hideDetailPanel()"
                style="background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 20px; padding: 0;">×</button>
      </div>

      ${data.badges ? `
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        ${data.badges.map(b => `
          <span style="padding: 4px 10px; background: ${b.color || 'rgba(255,255,255,0.1)'};
                       color: ${b.textColor || 'rgba(255,255,255,0.7)'}; border-radius: 20px;
                       font-size: 10px; font-weight: 600;">${b.text}</span>
        `).join('')}
      </div>
      ` : ''}

      ${data.sections ? data.sections.map(section => `
        <div style="margin-bottom: 16px;">
          ${section.title ? `
            <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 8px;
                        text-transform: uppercase; letter-spacing: 0.5px;">${section.title}</div>
          ` : ''}
          <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
            ${section.content}
          </div>
        </div>
      `).join('') : ''}

      ${data.actions ? `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;">
        ${data.actions.map(action => `
          <a href="${action.url}" target="_blank" rel="noopener noreferrer"
             style="flex: 1; min-width: 80px; padding: 10px 12px; background: ${action.primary ? `${data.color || '#3b82f6'}` : 'rgba(255,255,255,0.05)'};
                    border: 1px solid ${action.primary ? 'transparent' : 'rgba(255,255,255,0.15)'};
                    border-radius: 8px; color: ${action.primary ? 'white' : 'rgba(255,255,255,0.8)'};
                    text-decoration: none; text-align: center; font-size: 11px; font-weight: 600;
                    display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span>${action.icon || ''}</span> ${action.label}
          </a>
        `).join('')}
      </div>
      ` : ''}
    `;
  }

  // ============================================
  // SIDEBAR / CARD LIST
  // ============================================

  function renderCardList(containerId, items, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { filter, onSelect } = options;

    const filtered = filter
      ? items.filter(item => filter === 'all' || item.category === filter)
      : items;

    container.innerHTML = filtered.map(item => `
      <div class="pi-card ${selectedId === item.id ? 'selected' : ''}"
           onclick="PIPanels.selectCard('${item.id}')"
           data-id="${item.id}">
        ${cardRenderer(item)}
      </div>
    `).join('');

    // Store callback
    if (onSelect) {
      container._onSelect = onSelect;
    }
  }

  function selectCard(id) {
    selectedId = id;

    // Update UI
    document.querySelectorAll('.pi-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.id === id);
    });

    // Trigger callback
    const container = document.querySelector('.pi-card')?.parentElement;
    if (container?._onSelect) {
      container._onSelect(id);
    }
  }

  function defaultCardRenderer(item) {
    return `
      <div class="card-header">
        <div class="card-icon" style="background: ${item.color || '#3b82f6'}20; color: ${item.color || '#3b82f6'}">
          ${item.icon || '📍'}
        </div>
        <div class="card-info">
          <div class="card-title">${item.name}</div>
          <div class="card-subtitle">${item.subtitle || ''}</div>
        </div>
        <div class="card-status ${item.status || 'active'}">${item.statusText || ''}</div>
      </div>
      ${item.stats ? `
      <div class="card-stats">
        ${item.stats.slice(0, 3).map(s => `
          <div class="stat">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value" style="color: ${s.color || 'inherit'}">${s.value}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    `;
  }

  // ============================================
  // CUSTOM RENDERERS
  // ============================================

  function setTooltipRenderer(fn) {
    tooltipRenderer = fn || defaultTooltipRenderer;
  }

  function setDetailRenderer(fn) {
    detailRenderer = fn || defaultDetailRenderer;
  }

  function setCardRenderer(fn) {
    cardRenderer = fn || defaultCardRenderer;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    initTooltip,
    showTooltip,
    hideTooltip,
    initDetailPanel,
    showDetailPanel,
    hideDetailPanel,
    renderCardList,
    selectCard,
    setTooltipRenderer,
    setDetailRenderer,
    setCardRenderer,
    get selectedId() { return selectedId; }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PIPanels;
}
