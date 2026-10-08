import React, { useEffect, useState } from "react";
import {
  getSites,
  createSite,
  updateSite,
  deleteSite,
} from "../services/api";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [formData, setFormData] = useState({
    site_code: "",
    site_name: "",
    location: "",
    city: "",
    state: "",
    status: "ACTIVE",
    client_name: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deletingSite, setDeletingSite] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSites = async (page = 1, searchTerm = search) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSites({ page, limit: 10, search: searchTerm });
      if (response.success) {
        setSites(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load sites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites(1, "");
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSites(1, search);
  };

  const handleClearSearch = () => {
    setSearch("");
    fetchSites(1, "");
  };

  const handlePageChange = (newPage) => {
    fetchSites(newPage, search);
  };

  const openCreateModal = () => {
    setEditingSite(null);
    setFormData({
      site_code: "",
      site_name: "",
      location: "",
      city: "",
      state: "",
      status: "ACTIVE",
      client_name: "",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditModal = (site) => {
    setEditingSite(site);
    setFormData({
      site_code: site.site_code || "",
      site_name: site.site_name || "",
      location: site.location || "",
      city: site.city || "",
      state: site.state || "",
      status: site.status || "ACTIVE",
      client_name: site.client_name || "",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");

    try {
      if (editingSite) {
        await updateSite(editingSite.id, formData);
        setSuccessMsg("Site record updated successfully");
      } else {
        await createSite(formData);
        setSuccessMsg("Site registered successfully");
      }
      setIsFormOpen(false);
      fetchSites(pagination.page, search);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err.message || "Failed to save site record");
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingSite) return;
    setDeleteLoading(true);
    try {
      await deleteSite(deletingSite.id);
      setSuccessMsg(`Site "${deletingSite.site_name}" deleted successfully`);
      setDeletingSite(null);
      fetchSites(pagination.page, search);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete site");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sites</h1>
          <p className="page-description">
            Manage operational sites and their current status.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} aria-hidden="true" />
          <span>Add Site</span>
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
          <button className="btn btn-secondary btn-sm" onClick={() => fetchSites(pagination.page, search)}>
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
            placeholder="Search sites by code, name, city, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search sites"
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
                  <th>Site Code</th>
                  <th>Site Name</th>
                  <th>Client</th>
                  <th>Location</th>
                  <th>State</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="skeleton-table-row">
                    <td><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 140 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 110 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 130 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 40, marginLeft: "auto" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : sites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon-wrap" aria-hidden="true">
                <Building2 size={24} />
              </div>
              <h3 className="empty-state-title">No sites found</h3>
              <p className="empty-state-desc">
                {search
                  ? `No operational sites matched "${search}". Try adjusting your query.`
                  : "No operational sites have been registered yet."}
              </p>
              {search ? (
                <button className="btn btn-secondary btn-sm" onClick={handleClearSearch}>
                  Clear Search Filter
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={14} aria-hidden="true" />
                  <span>Add First Site</span>
                </button>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Site Code</th>
                  <th>Site Name</th>
                  <th>Client</th>
                  <th>Location</th>
                  <th>State</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id}>
                    <td>
                      <span className="cell-code">{site.site_code}</span>
                    </td>
                    <td className="cell-primary">
                      {site.site_name}
                    </td>
                    <td>
                      {site.client_name ? site.client_name : <span style={{ color: "#94A3B8" }}>—</span>}
                    </td>
                    <td>
                      {site.location ? site.location : <span style={{ color: "#94A3B8" }}>—</span>}
                    </td>
                    <td>
                      {site.city && site.state
                        ? `${site.city}, ${site.state}`
                        : site.state || site.city || <span style={{ color: "#94A3B8" }}>—</span>}
                    </td>
                    <td>
                      <span className={`status-badge status-${site.status?.toLowerCase()}`}>
                        <span className="status-dot" aria-hidden="true" />
                        <span>{site.status}</span>
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions" style={{ justifyContent: "flex-end" }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(site)}
                          title={`Edit ${site.site_name}`}
                          aria-label={`Edit ${site.site_name}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => setDeletingSite(site)}
                          title={`Delete ${site.site_name}`}
                          aria-label={`Delete ${site.site_name}`}
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

      {/* Redesigned Modal: Add / Edit Project Site */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSite ? "Edit Project Site" : "Add Project Site"}
        subtitle={editingSite ? "Update operational site details and status" : "Register a new operational site"}
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

            <div className="form-section-title">SITE INFORMATION</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="site_code">
                  Site Code <span className="required">*</span>
                </label>
                <input
                  id="site_code"
                  type="text"
                  className="form-input"
                  placeholder="Enter site code"
                  value={formData.site_code}
                  onChange={(e) => setFormData({ ...formData, site_code: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="site_status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="site_status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site_name">
                Site Name <span className="required">*</span>
              </label>
              <input
                id="site_name"
                type="text"
                className="form-input"
                placeholder="Enter site name"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client_name">
                Client
              </label>
              <input
                id="client_name"
                type="text"
                className="form-input"
                placeholder="Enter client name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>

            <div className="form-section-title" style={{ marginTop: "24px" }}>
              LOCATION
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site_location">
                Location / Street Address
              </label>
              <input
                id="site_location"
                type="text"
                className="form-input"
                placeholder="Enter location or street address"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="site_city">
                  City
                </label>
                <input
                  id="site_city"
                  type="text"
                  className="form-input"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="site_state">
                  State
                </label>
                <input
                  id="site_state"
                  type="text"
                  className="form-input"
                  placeholder="Enter state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
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
                : editingSite
                ? "Save Changes"
                : "Create Site"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingSite)}
        onClose={() => setDeletingSite(null)}
        onConfirm={confirmDelete}
        title="Delete Site?"
        message={`This action will permanently remove "${deletingSite?.site_name}" (${deletingSite?.site_code}) and its related installations.`}
        confirmText="Delete Site"
        loading={deleteLoading}
      />
    </div>
  );
}
