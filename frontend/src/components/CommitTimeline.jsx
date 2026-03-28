import React, { useMemo } from 'react';

const CommitTimeline = ({ activity, isLoading }) => {
  const chartData = useMemo(() => {
    if (!activity || activity.length === 0) return null;
    // Take last 26 weeks for a cleaner chart
    const recent = activity.slice(-26);
    const max = Math.max(...recent.map(w => w.total), 1);
    return { weeks: recent, max };
  }, [activity]);

  if (isLoading) {
    return (
      <div className="timeline-container">
        <h3>📈 Commit Activity</h3>
        <div className="skeleton-block" style={{ height: '180px' }}>
          <div className="skeleton-line" style={{ width: '100%' }}></div>
        </div>
      </div>
    );
  }

  if (!chartData) return null;

  const W = 700, H = 160, barGap = 3;
  const barWidth = (W - barGap * chartData.weeks.length) / chartData.weeks.length;
  const totalCommits = chartData.weeks.reduce((s, w) => s + w.total, 0);

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>📈 Commit Activity</h3>
        <span className="timeline-stat">{totalCommits} commits in last 26 weeks</span>
      </div>
      <div className="timeline-chart-wrapper">
        <svg viewBox={`0 0 ${W} ${H}`} className="timeline-svg" preserveAspectRatio="xMidYMid meet">
          {chartData.weeks.map((week, i) => {
            const barH = (week.total / chartData.max) * (H - 30);
            const x = i * (barWidth + barGap);
            const y = H - 20 - barH;
            const intensity = Math.min(week.total / chartData.max, 1);
            const opacity = 0.3 + intensity * 0.7;
            return (
              <g key={i}>
                <rect
                  x={x} y={y} width={barWidth} height={Math.max(barH, 2)}
                  rx="2" fill={`rgba(59, 130, 246, ${opacity})`}
                  className="timeline-bar"
                />
                <title>{week.week}: {week.total} commits</title>
                {i % 4 === 0 && (
                  <text x={x + barWidth / 2} y={H - 4} textAnchor="middle"
                    fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">
                    {new Date(week.week).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default CommitTimeline;
