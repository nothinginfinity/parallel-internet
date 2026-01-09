// Parallel Internet - Tech/AI Template
// SaaS companies, AI providers, tech startups

const PITech = (function() {
  'use strict';

  // ============================================
  // TEMPLATE CONFIG
  // ============================================

  const TEMPLATE_ID = 'tech';
  const TEMPLATE_NAME = 'Tech / AI Companies';
  const TEMPLATE_ICON = '💻';

  const DEFAULT_COLORS = {
    primary: '#3b82f6',    // Blue
    secondary: '#1e40af',  // Dark blue
    accent: '#22c55e'      // Green
  };

  // ============================================
  // FORMATTERS
  // ============================================

  function formatTooltipData(provider) {
    const trendIcon = provider.trend === 'up' ? '📈' : provider.trend === 'down' ? '📉' : '➡️';

    return {
      name: provider.name,
      subtitle: provider.hq || '',
      icon: provider.logo || '💻',
      color: provider.color,
      stats: [
        { label: 'Speed', value: `${provider.performance?.tokensPerSec || '--'}/s`, color: '#22c55e' },
        { label: 'Trend', value: trendIcon },
        { label: 'Output', value: `$${provider.pricing?.output || '--'}/M`, color: '#f59e0b' },
        { label: 'Status', value: provider.status || 'online', color: '#22c55e' }
      ]
    };
  }

  function formatCardData(provider) {
    return {
      id: provider.id,
      name: provider.name,
      subtitle: provider.hq || provider.category || '',
      icon: provider.logo || '💻',
      color: provider.color,
      status: provider.status || 'online',
      statusText: provider.status || 'Online',
      category: provider.category,
      stats: [
        { label: 'Input', value: `$${provider.pricing?.input?.toFixed(2) || '--'}`, color: '#f59e0b' },
        { label: 'Output', value: `$${provider.pricing?.output?.toFixed(2) || '--'}`, color: '#f59e0b' },
        { label: 'Speed', value: `${provider.performance?.tokensPerSec || '--'}/s`, color: '#22c55e' }
      ]
    };
  }

  function formatDetailData(provider) {
    const trendIcon = provider.trend === 'up' ? '📈 Growing' : provider.trend === 'down' ? '📉 Declining' : '➡️ Stable';
    const contextPercent = provider.contextWindow?.reported > 0
      ? ((provider.contextWindow.actual / provider.contextWindow.reported) * 100).toFixed(0)
      : 'N/A';

    const sections = [];

    // Models
    if (provider.models?.length > 0) {
      sections.push({
        title: 'Models',
        content: `
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${provider.models.map(m => `
              <span style="padding: 3px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px;">${m}</span>
            `).join('')}
          </div>
        `
      });
    }

    // Pricing
    sections.push({
      title: 'Pricing (per 1M tokens)',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Input</div>
            <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">$${provider.pricing?.input?.toFixed(2) || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Output</div>
            <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">$${provider.pricing?.output?.toFixed(2) || '--'}</div>
          </div>
        </div>
      `
    });

    // Performance
    sections.push({
      title: 'Performance',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Speed</div>
            <div style="font-size: 20px; font-weight: 700; color: #22c55e;">${provider.performance?.tokensPerSec || '--'}</div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.4);">tokens/sec</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Latency</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${provider.performance?.latency || '--'}s</div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.4);">first token</div>
          </div>
        </div>
      `
    });

    // Context Window
    if (provider.contextWindow) {
      sections.push({
        title: 'Context Window',
        content: `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 10px; color: rgba(255,255,255,0.5);">Effective</span>
            <span style="font-size: 10px; color: rgba(255,255,255,0.7);">${contextPercent}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div>
              <span style="font-size: 16px; font-weight: 700; color: #3b82f6;">${formatNumber(provider.contextWindow.reported)}</span>
              <span style="font-size: 10px; color: rgba(255,255,255,0.4);"> reported</span>
            </div>
            <div>
              <span style="font-size: 16px; font-weight: 700; color: #f59e0b;">${formatNumber(provider.contextWindow.actual)}</span>
              <span style="font-size: 10px; color: rgba(255,255,255,0.4);"> tested</span>
            </div>
          </div>
          <div style="margin-top: 8px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; width: ${contextPercent}%; background: linear-gradient(90deg, #3b82f6, #f59e0b); border-radius: 3px;"></div>
          </div>
        `
      });
    }

    // Actions
    const actions = [];
    if (provider.website) {
      actions.push({ label: 'Website', icon: '🌐', url: provider.website });
    }
    if (provider.docs) {
      actions.push({ label: 'Docs', icon: '📚', url: provider.docs });
    }
    if (provider.apiPlayground) {
      actions.push({ label: 'Playground', icon: '🔗', url: provider.apiPlayground, primary: true });
    }

    return {
      ...provider,
      icon: provider.logo || '💻',
      subtitle: `Founded ${provider.founded || '--'} • ${provider.hq || ''}`,
      badges: [
        { text: provider.category?.toUpperCase() || 'TECH', color: `${provider.color}20`, textColor: provider.color },
        { text: provider.status?.toUpperCase() || 'ONLINE', color: 'rgba(34,197,94,0.2)', textColor: '#22c55e' },
        { text: trendIcon }
      ],
      sections,
      actions
    };
  }

  function formatNumber(num) {
    if (!num) return '--';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  }

  function getTickerStats(config) {
    const providers = config.locations || [];
    const totalTokens = providers.reduce((sum, p) => sum + (p.monthlyTokens || 0), 0);
    const totalCost = providers.reduce((sum, p) => sum + ((p.monthlyTokens || 0) / 1000000 * (p.pricing?.output || 0)), 0);
    const avgLatency = providers.length > 0
      ? providers.reduce((sum, p) => sum + (p.performance?.latency || 0), 0) / providers.length
      : 0;
    const activeCount = providers.filter(p => p.status === 'online').length;

    return [
      { label: 'Total Tokens/Month', value: formatNumber(totalTokens) },
      { label: 'Est. Monthly Cost', value: `$${totalCost.toFixed(2)}`, class: 'warning' },
      { label: 'Avg Latency', value: `${avgLatency.toFixed(2)}s` },
      { label: 'Active Providers', value: activeCount, class: 'primary' }
    ];
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function apply() {
    PITemplate.setTooltipFormatter(formatTooltipData);
    PITemplate.setCardFormatter(formatCardData);
    PITemplate.setDetailFormatter(formatDetailData);
    PITemplate.setTickerStats(() => getTickerStats(PITemplate.config));
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
    formatNumber
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PITech;
}
