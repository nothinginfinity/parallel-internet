// Parallel Internet - Education Template
// Schools, universities, tutoring centers

const PIEducation = (function() {
  'use strict';

  const TEMPLATE_ID = 'education';
  const TEMPLATE_NAME = 'Education';
  const TEMPLATE_ICON = '🎓';

  const DEFAULT_COLORS = {
    primary: '#06b6d4',
    secondary: '#0891b2',
    accent: '#22d3ee'
  };

  function formatEnrollment(num) {
    if (!num) return '--';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function formatTooltipData(campus) {
    return {
      name: campus.name,
      subtitle: `${campus.city}, ${campus.state}`,
      icon: '🎓',
      color: campus.color,
      stats: [
        { label: 'Enrollment', value: formatEnrollment(campus.enrollment) },
        { label: 'Type', value: campus.campusType || 'Campus' }
      ]
    };
  }

  function formatCardData(campus) {
    return {
      id: campus.id,
      name: campus.name,
      subtitle: `${campus.city}, ${campus.state}`,
      icon: '🎓',
      color: campus.color,
      status: campus.status || 'active',
      statusText: campus.status === 'closed' ? 'Closed' : 'Active',
      category: campus.campusType,
      stats: [
        { label: 'Enrollment', value: formatEnrollment(campus.enrollment) },
        { label: 'Programs', value: campus.programs?.length || '--' },
        { label: 'Grad Rate', value: campus.graduationRate ? `${campus.graduationRate}%` : '--' }
      ]
    };
  }

  function formatDetailData(campus) {
    const sections = [];

    sections.push({
      title: 'Campus Statistics',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Enrollment</div>
            <div style="font-size: 24px; font-weight: 700; color: #06b6d4;">${campus.enrollment?.toLocaleString() || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Graduation Rate</div>
            <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${campus.graduationRate || '--'}%</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Student/Faculty</div>
            <div style="font-size: 24px; font-weight: 700; color: #22d3ee;">${campus.studentFacultyRatio || '--'}:1</div>
          </div>
          <div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">Acceptance Rate</div>
            <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${campus.acceptanceRate || '--'}%</div>
          </div>
        </div>
      `
    });

    if (campus.programs && campus.programs.length > 0) {
      sections.push({
        title: 'Top Programs',
        content: `
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${campus.programs.slice(0, 8).map(p => `
              <span style="padding: 3px 8px; background: rgba(6,182,212,0.1); border-radius: 4px; font-size: 10px; color: #22d3ee;">${p}</span>
            `).join('')}
          </div>
        `
      });
    }

    if (campus.tuition) {
      sections.push({
        title: 'Tuition & Fees',
        content: `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: rgba(255,255,255,0.5);">In-State</span>
            <span style="font-weight: 600;">$${campus.tuition.inState?.toLocaleString() || '--'}/yr</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: rgba(255,255,255,0.5);">Out-of-State</span>
            <span style="font-weight: 600;">$${campus.tuition.outOfState?.toLocaleString() || '--'}/yr</span>
          </div>
        `
      });
    }

    if (campus.ranking) {
      sections.push({
        title: 'Rankings',
        content: `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: rgba(255,255,255,0.5);">National</span>
            <span style="font-size: 20px; font-weight: 700; color: #fbbf24;">#${campus.ranking}</span>
          </div>
        `
      });
    }

    const actions = [];
    if (campus.links?.apply) {
      actions.push({ label: 'Apply Now', icon: '📝', url: campus.links.apply, primary: true });
    }
    if (campus.links?.tour) {
      actions.push({ label: 'Virtual Tour', icon: '🎥', url: campus.links.tour });
    }
    if (campus.links?.directions) {
      actions.push({ label: 'Directions', icon: '📍', url: campus.links.directions });
    }

    return {
      ...campus,
      icon: '🎓',
      subtitle: `${campus.address}\n${campus.city}, ${campus.state} ${campus.zip}`,
      badges: [
        {
          text: campus.campusType?.toUpperCase() || 'CAMPUS',
          color: 'rgba(6,182,212,0.2)',
          textColor: '#06b6d4'
        },
        campus.ranking ? { text: `#${campus.ranking} RANKED` } : null
      ].filter(Boolean),
      sections,
      actions
    };
  }

  function getTickerStats(config) {
    const campuses = config.locations || [];
    const totalEnrollment = campuses.reduce((sum, c) => sum + (c.enrollment || 0), 0);
    const avgGradRate = campuses.filter(c => c.graduationRate).length > 0
      ? campuses.reduce((sum, c) => sum + (c.graduationRate || 0), 0) / campuses.filter(c => c.graduationRate).length
      : 0;
    const totalPrograms = campuses.reduce((sum, c) => sum + (c.programs?.length || 0), 0);

    return [
      { label: 'Total Enrollment', value: formatEnrollment(totalEnrollment), class: 'primary' },
      { label: 'Avg. Grad Rate', value: `${Math.round(avgGradRate)}%` },
      { label: 'Total Programs', value: totalPrograms },
      { label: 'Campuses', value: campuses.length }
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
  module.exports = PIEducation;
}
