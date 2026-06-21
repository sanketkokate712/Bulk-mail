import { useState, useMemo, useEffect } from 'react';
import { DownloadIcon, SearchIcon, RefreshIcon, ClockIcon } from '../components/Icons';
import { exportResultsCSV, downloadFile } from '../data/mockData';
import { getUserCampaigns } from '../api/db';
import './DashboardPage.css';

export default function DashboardPage({ currentResults, recipients, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pastCampaigns, setPastCampaigns] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      getUserCampaigns(user.uid).then(setPastCampaigns).catch(console.error);
    }
  }, [user]);

  // Merge current results with past campaigns
  const hasCurrentCampaign = currentResults && currentResults.length > 0;

  const currentStats = useMemo(() => {
    if (!hasCurrentCampaign) {
      if (pastCampaigns.length > 0) {
        const last = pastCampaigns[0];
        return {
          total: last.totalRecipients || 0,
          sent: last.sentCount || 0,
          bounced: last.bouncedCount || 0,
          failed: last.failedCount || 0,
          pending: last.pendingCount || 0,
        };
      }
      return { total: 0, sent: 0, bounced: 0, failed: 0, pending: 0 };
    }
    const sent = currentResults.filter(r => r.status === 'sent').length;
    const bounced = currentResults.filter(r => r.status === 'bounced').length;
    const failed = currentResults.filter(r => r.status === 'failed').length;
    const pending = recipients.length - sent - bounced - failed;
    return { total: recipients.length, sent, bounced, failed, pending: Math.max(0, pending) };
  }, [currentResults, hasCurrentCampaign, recipients]);

  const successRate = currentStats.total > 0
    ? ((currentStats.sent / currentStats.total) * 100).toFixed(1)
    : 0;

  // Donut chart calculations
  const chartData = [
    { label: 'Sent', value: currentStats.sent, color: '#1ed760' },
    { label: 'Bounced', value: currentStats.bounced, color: '#ffa42b' },
    { label: 'Failed', value: currentStats.failed, color: '#f3727f' },
    { label: 'Pending', value: currentStats.pending, color: '#727272' },
  ].filter(d => d.value > 0);

  const circumference = 2 * Math.PI * 60;
  let offset = 0;
  const chartSegments = chartData.map(d => {
    const pct = d.value / currentStats.total;
    const dashLength = pct * circumference;
    const segment = { ...d, dashArray: `${dashLength} ${circumference - dashLength}`, dashOffset: -offset };
    offset += dashLength;
    return segment;
  });

  // Filtered results for the table
  const displayResults = hasCurrentCampaign ? currentResults : [];
  const filteredResults = displayResults.filter(r => {
    const matchSearch = !searchQuery || r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const csv = exportResultsCSV(displayResults);
    downloadFile(csv, `campaign_results_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign Dashboard</h1>
          <p className="page-subtitle">
            {hasCurrentCampaign
              ? `Current campaign — ${currentStats.total} recipients`
              : 'Viewing most recent campaign results'}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-pill-outlined-sm" onClick={handleExport} id="export-csv-btn">
            <DownloadIcon style={{ width: 14, height: 14 }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper">
        <div className="step completed"><div className="step-num">✓</div><span className="step-label">Upload</span></div>
        <div className="step-line completed" />
        <div className="step completed"><div className="step-num">✓</div><span className="step-label">Compose</span></div>
        <div className="step-line completed" />
        <div className="step completed"><div className="step-num">✓</div><span className="step-label">Send</span></div>
        <div className="step-line completed" />
        <div className="step active"><div className="step-num">4</div><span className="step-label">Report</span></div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--green">
          <span className="stat-label">Delivered</span>
          <span className="stat-value">{currentStats.sent}</span>
          <span className="stat-pct">{successRate}% success rate</span>
        </div>
        <div className="stat-card stat-card--orange">
          <span className="stat-label">Bounced</span>
          <span className="stat-value">{currentStats.bounced}</span>
          <span className="stat-pct">{currentStats.total > 0 ? ((currentStats.bounced / currentStats.total) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="stat-card stat-card--red">
          <span className="stat-label">Failed</span>
          <span className="stat-value">{currentStats.failed}</span>
          <span className="stat-pct">{currentStats.total > 0 ? ((currentStats.failed / currentStats.total) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="stat-card stat-card--gray">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{currentStats.pending}</span>
          <span className="stat-pct">{currentStats.total > 0 ? ((currentStats.pending / currentStats.total) * 100).toFixed(1) : 0}%</span>
        </div>
      </div>

      {/* Chart + Past Campaigns */}
      <div className="dashboard-grid">
        {/* Donut Chart */}
        <div className="chart-card">
          <h3 className="card-title">Delivery Breakdown</h3>
          <div className="donut-container">
            <div className="donut-chart">
              <svg viewBox="0 0 140 140">
                {chartSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="70"
                    cy="70"
                    r="60"
                    stroke={seg.color}
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                    strokeLinecap="round"
                    style={{ transition: 'all 0.8s ease' }}
                  />
                ))}
              </svg>
              <div className="donut-center">
                <span className="donut-center-value">{currentStats.total}</span>
                <span className="donut-center-label">Total</span>
              </div>
            </div>
            <div className="donut-legend">
              {chartData.map((d, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ background: d.color }} />
                  <span className="legend-label">{d.label}</span>
                  <span className="legend-value">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Past Campaigns */}
        <div className="campaigns-card">
          <h3 className="card-title">Recent Campaigns</h3>
          <div className="campaigns-list">
            {pastCampaigns.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '10px' }}>No past campaigns found.</p>
            ) : (
              pastCampaigns.map(c => (
                <div key={c.id} className="campaign-row">
                  <div className="campaign-info">
                    <span className="campaign-name">{c.name}</span>
                    <span className="campaign-date">
                      <ClockIcon style={{ width: 12, height: 12 }} />
                      {c.date}
                    </span>
                  </div>
                  <div className="campaign-stats-mini">
                    <span className="cstat cstat--green">{c.sentCount || 0}</span>
                    <span className="cstat cstat--orange">{c.bouncedCount || 0}</span>
                    <span className="cstat cstat--red">{c.failedCount || 0}</span>
                  </div>
                  <span className={`status-pill status-pill--${c.status}`}>
                    <span className="status-dot" />
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      {displayResults.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h3 className="card-title">Per-Recipient Results</h3>
            <div className="results-filters">
              <div className="search-pill">
                <SearchIcon style={{ width: 14, height: 14 }} />
                <input
                  type="text"
                  placeholder="Search email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-pills">
                {['all', 'sent', 'bounced', 'failed'].map(s => (
                  <button
                    key={s}
                    className={`filter-pill ${statusFilter === s ? 'filter-pill--active' : ''}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="results-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r, i) => (
                  <tr key={i}>
                    <td className="row-num">{r.index + 1}</td>
                    <td className="email-cell">{r.email}</td>
                    <td>
                      <span className={`status-pill status-pill--${r.status}`}>
                        <span className="status-dot" />
                        {r.status}
                      </span>
                    </td>
                    <td className="msg-cell">{r.message}</td>
                    <td className="time-cell">{r.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
