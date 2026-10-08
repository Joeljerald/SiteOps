import React, { useEffect, useState } from "react";
import { getDashboardSummary } from "../services/api";
import {
  Users,
  Building2,
  Wrench,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboardSummary();
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Connecting to PostgreSQL 18 & calculating metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert-banner alert-danger">
          <AlertCircle size={18} />
          <div style={{ flex: 1 }}>
            <strong>Connection Error:</strong> {error}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboard}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const {
    totalUsers = 0,
    totalSites = 0,
    totalInstallations = 0,
    completedInstallations = 0,
    pendingInstallations = 0,
    recentInstallations = [],
    installationsByStatus = [],
    installationsBySite = [],
  } = data || {};

  const completionPercentage =
    totalInstallations > 0
      ? Math.round((completedInstallations / totalInstallations) * 100)
      : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Overview of operational sites, installations, and system activity.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchDashboard}
          title="Refresh metrics from PostgreSQL"
          aria-label="Refresh metrics"
        >
          <RefreshCw size={15} aria-hidden="true" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" aria-hidden="true">
            <Building2 size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-title">Total Sites</div>
            <div className="kpi-value">{totalSites}</div>
            <div className="kpi-subtext">Active operational locations</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" aria-hidden="true">
            <Wrench size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-title">Total Installations</div>
            <div className="kpi-value">{totalInstallations}</div>
            <div className="kpi-subtext">Logged work orders</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-success" aria-hidden="true">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-title">Completed</div>
            <div className="kpi-value">{completedInstallations}</div>
            <div className="kpi-subtext">{completionPercentage}% fulfillment rate</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-warning" aria-hidden="true">
            <Clock size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-title">Pending / In-Progress</div>
            <div className="kpi-value">{pendingInstallations}</div>
            <div className="kpi-subtext">In-progress & scheduled</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" aria-hidden="true">
            <Users size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-title">Total Users</div>
            <div className="kpi-value">{totalUsers}</div>
            <div className="kpi-subtext">Registered team members</div>
          </div>
        </div>
      </div>

      {/* SECTIONS: RECENT INSTALLATIONS & DISTRIBUTIONS */}
      <div className="dashboard-sections-grid">
        {/* Left Column: Recent Installations */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Installations</h2>
              <div className="card-subtitle">
                Latest work order activity
              </div>
            </div>
            <span className="card-header-badge">
              Latest 5 Records
            </span>
          </div>

          <div className="table-wrapper">
            {recentInstallations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon-wrap" aria-hidden="true">
                  <Layers size={24} />
                </div>
                <h3 className="empty-state-title">No Recent Activity</h3>
                <p className="empty-state-desc">
                  New installation work orders logged in the system will automatically appear here.
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Work Order</th>
                    <th>Site Location</th>
                    <th>Assigned Lead</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInstallations.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>
                        {item.installation_type}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.site_name}</div>
                        <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                          <code>{item.site_code}</code> {item.city ? `• ${item.city}` : ""}
                        </div>
                      </td>
                      <td>{item.assigned_to || <span style={{ color: "#94a3b8" }}>Unassigned</span>}</td>
                      <td>
                        {item.scheduled_date ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8125rem" }}>
                            <Calendar size={13} color="#94a3b8" aria-hidden="true" />
                            {item.scheduled_date.slice(0, 10)}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge badge-${item.status
                            ?.toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          <span className="status-dot" aria-hidden="true" />
                          <span>{item.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Status Distribution & Site Workloads */}
        <div className="dashboard-sidebar-column">
          {/* Status Distribution */}
          <div className="content-card status-breakdown-card">
            <div className="card-header status-breakdown-header">
              <div>
                <h2 className="status-breakdown-title">Status Breakdown</h2>
                <div className="status-breakdown-subtitle">Work orders by status</div>
              </div>
              <div className="status-breakdown-total">
                <span className="status-breakdown-total-num">
                  {installationsByStatus.reduce((acc, curr) => acc + Number(curr.count || 0), 0) || totalInstallations || 0}
                </span>
                <span className="status-breakdown-total-label">Total Work Orders</span>
              </div>
            </div>
            <div className="status-breakdown-body">
              {installationsByStatus.length === 0 ? (
                <div className="status-breakdown-empty">
                  No installation status data recorded.
                </div>
              ) : (
                <div className="status-breakdown-list">
                  {installationsByStatus.map((stat, idx) => {
                    const totalCount =
                      installationsByStatus.reduce((acc, curr) => acc + Number(curr.count || 0), 0) || totalInstallations || 0;
                    const pct = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
                    const statusKey = stat.status?.toLowerCase().replace(/[_\s]+/g, "-");
                    return (
                      <div key={idx} className="status-breakdown-row">
                        <div className="status-breakdown-row-top">
                          <span className={`status-badge-compact badge-${statusKey}`}>
                            <span className="status-dot" aria-hidden="true" />
                            <span>{stat.status}</span>
                          </span>
                          <div className="status-breakdown-stats">
                            <span className="status-breakdown-count">{stat.count}</span>
                            <span className="status-breakdown-pct">{pct}%</span>
                          </div>
                        </div>
                        <div className="status-progress-track">
                          <div
                            className={`status-progress-fill fill-${statusKey}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Workload by Site */}
          <div className="content-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Site Workload</h2>
                <div className="card-subtitle">Work orders per site</div>
              </div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {installationsBySite.length === 0 ? (
                <div style={{ fontSize: "0.825rem", color: "#64748b", textAlign: "center", padding: "12px 0" }}>
                  No sites registered.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {installationsBySite.map((site) => (
                    <div
                      key={site.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>
                          {site.site_name}
                        </div>
                        <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                          <code>{site.site_code}</code>
                        </div>
                      </div>
                      <span
                        style={{
                          backgroundColor: site.installation_count > 0 ? "#eff6ff" : "#f1f5f9",
                          color: site.installation_count > 0 ? "#1d4ed8" : "#64748b",
                          border: `1px solid ${site.installation_count > 0 ? "#bfdbfe" : "#e2e8f0"}`,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {site.installation_count} {site.installation_count === 1 ? "job" : "jobs"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
