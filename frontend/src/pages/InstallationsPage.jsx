import React, { useEffect, useState } from "react";
import {
  getInstallations,
  createInstallation,
  updateInstallation,
  deleteInstallation,
  getSites,
} from "../services/api";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Wrench,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
} from "lucide-react";

export default function InstallationsPage() {
  const [installations, setInstallations] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstall, setEditingInstall] = useState(null);
  const [formData, setFormData] = useState({
    site_id: "",
    installation_type: "",
    status: "SCHEDULED",
    scheduled_date: "",
    completion_date: "",
    assigned_to: "",
    notes: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deletingInstall, setDeletingInstall] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSitesForSelect = async () => {
    try {
      const res = await getSites({ limit: 100 });
      if (res.success) {
        setSitesList(res.data);
      }
    } catch (e) {
      console.warn("Could not load sites list for dropdown:", e);
    }
  };

  const fetchInstallations = async (page = 1, searchTerm = search) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInstallations({ page, limit: 10, search: searchTerm });
      if (response.success) {
        setInstallations(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load installations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations(1, "");
    fetchSitesForSelect();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInstallations(1, search);
  };

  const handleClearSearch = () => {
    setSearch("");
    fetchInstallations(1, "");
  };

  const handlePageChange = (newPage) => {
    fetchInstallations(newPage, search);
  };

  const openCreateModal = () => {
    setEditingInstall(null);
    setFormData({
      site_id: sitesList.length > 0 ? String(sitesList[0].id) : "",
      installation_type: "",
      status: "SCHEDULED",
      scheduled_date: "",
      completion_date: "",
      assigned_to: "",
      notes: "",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditModal = (inst) => {
    setEditingInstall(inst);
    setFormData({
      site_id: String(inst.site_id || ""),
      installation_type: inst.installation_type || "",
      status: inst.status || "SCHEDULED",
      scheduled_date: inst.scheduled_date ? inst.scheduled_date.slice(0, 10) : "",
      completion_date: inst.completion_date ? inst.completion_date.slice(0, 10) : "",
      assigned_to: inst.assigned_to || "",
      notes: inst.notes || "",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");

    if (!formData.site_id) {
      setFormError("Please select a target site for this installation.");
      setFormSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        site_id: parseInt(formData.site_id, 10),
        scheduled_date: formData.scheduled_date || null,
        completion_date: formData.completion_date || null,
      };

      if (editingInstall) {
        await updateInstallation(editingInstall.id, payload);
        setSuccessMsg("Installation work order updated successfully");
      } else {
        await createInstallation(payload);
        setSuccessMsg("Installation work order created successfully");
      }
      setIsFormOpen(false);
      fetchInstallations(pagination.page, search);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err.message || "Failed to save installation work order");
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingInstall) return;
    setDeleteLoading(true);
    try {
      await deleteInstallation(deletingInstall.id);
      setSuccessMsg("Installation work order deleted successfully");
      setDeletingInstall(null);
      fetchInstallations(pagination.page, search);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete installation");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Installations</h1>
          <p className="page-description">
            Track installation schedules, assignments and progress.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} aria-hidden="true" />
          <span>Schedule Installation</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="alert-banner alert-success" role="alert">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-danger" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <div style={{ flex: 1 }}>{error}</div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchInstallations(pagination.page, search)}>
            Try Again
          </button>
        </div>
      )}

      {/* Toolbar: Search */}
      <div className="toolbar">
        <form onSubmit={handleSearchSubmit} className="search-input-wrap">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search installations by type, status, lead, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search installations"
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearSearch}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Content Card with Table */}
      <div className="content-card">
        <div className="table-wrapper">
          {loading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Installation</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Scheduled</th>
                  <th>Completed</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="skeleton-table-row">
                    <td><div className="skeleton skeleton-text" style={{ width: 140 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 90 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 40, marginLeft: "auto" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : installations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon-wrap" aria-hidden="true">
                <Wrench size={24} />
              </div>
              <h3 className="empty-state-title">No installations found</h3>
              <p className="empty-state-desc">
                {search
                  ? `No installation work orders matched "${search}". Try adjusting your query.`
                  : "No installation work orders registered yet."}
              </p>
              {search ? (
                <button className="btn btn-secondary btn-sm" onClick={handleClearSearch}>
                  Clear Search Filter
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={14} aria-hidden="true" />
                  <span>Create First Work Order</span>
                </button>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Installation</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Scheduled</th>
                  <th>Completed</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {installations.map((inst) => (
                  <tr key={inst.id}>
                    <td>
                      <div className="cell-primary">{inst.installation_type}</div>
                      {inst.notes && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748B",
                            maxWidth: "260px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={inst.notes}
                        >
                          {inst.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#0F172A" }}>
                        {inst.site_name || `Site #${inst.site_id}`}
                      </div>
                      {inst.site_code && (
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          <code>{inst.site_code}</code>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${inst.status?.toLowerCase().replace(/[\s-]+/g, "_")}`}>
                        <span className="status-dot" aria-hidden="true" />
                        <span>{inst.status}</span>
                      </span>
                    </td>
                    <td>
                      {inst.assigned_to ? inst.assigned_to : <span style={{ color: "#94A3B8" }}>—</span>}
                    </td>
                    <td>
                      {inst.scheduled_date ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem" }}>
                          <Calendar size={13} color="#94A3B8" aria-hidden="true" />
                          {inst.scheduled_date.slice(0, 10)}
                        </span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>—</span>
                      )}
                    </td>
                    <td>
                      {inst.completion_date ? (
                        <span style={{ fontSize: "0.8125rem", color: "#16A34A", fontWeight: 500 }}>
                          {inst.completion_date.slice(0, 10)}
                        </span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="cell-actions" style={{ justifyContent: "flex-end" }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(inst)}
                          title={`Edit ${inst.installation_type}`}
                          aria-label={`Edit ${inst.installation_type}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => setDeletingInstall(inst)}
                          title={`Delete ${inst.installation_type}`}
                          aria-label={`Delete ${inst.installation_type}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Server-Side Pagination */}
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      </div>

      {/* Redesigned Modal: Schedule / Edit Installation */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingInstall ? "Edit Installation" : "Schedule Installation"}
        subtitle={editingInstall ? "Update work order assignment and completion milestones" : "Create an operational installation work order"}
        maxWidth="680px"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body">
            {formError && (
              <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>
                <AlertCircle size={15} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-section-title">FACILITY & WORK ORDER</div>

            <div className="form-group">
              <label className="form-label" htmlFor="site_id">
                Target Site <span className="required">*</span>
              </label>
              <select
                id="site_id"
                className="form-select"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                required
              >
                <option value="">Select an operational site...</option>
                {sitesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_code} — {s.site_name} {s.city ? `(${s.city})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="installation_type">
                  Installation Type <span className="required">*</span>
                </label>
                <input
                  id="installation_type"
                  type="text"
                  className="form-input"
                  placeholder="Enter installation type"
                  value={formData.installation_type}
                  onChange={(e) => setFormData({ ...formData, installation_type: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="inst_status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="inst_status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="form-section-title" style={{ marginTop: "24px" }}>
              SCHEDULE & ASSIGNMENT
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="scheduled_date">
                  Scheduled Date
                </label>
                <input
                  id="scheduled_date"
                  type="date"
                  className="form-input"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="completion_date">
                  Completion Date
                </label>
                <input
                  id="completion_date"
                  type="date"
                  className="form-input"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="assigned_to">
                Assigned Lead / Technician
              </label>
              <input
                id="assigned_to"
                type="text"
                className="form-input"
                placeholder="Enter assigned lead or technician"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="notes">
                Technical Notes & Specifications
              </label>
              <textarea
                id="notes"
                className="form-textarea"
                rows={2}
                placeholder="Enter technical notes and specifications"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formSubmitting}
            >
              {formSubmitting
                ? "Saving..."
                : editingInstall
                ? "Save Changes"
                : "Schedule Installation"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingInstall)}
        onClose={() => setDeletingInstall(null)}
        onConfirm={confirmDelete}
        title="Delete Installation Work Order?"
        message={`Are you sure you want to delete work order #${deletingInstall?.id} ("${deletingInstall?.installation_type}")?`}
        confirmText="Delete Work Order"
        loading={deleteLoading}
      />
    </div>
  );
}
