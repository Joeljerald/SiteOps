import React, { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/api";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import {
  Plus,
  Edit2,
  Trash2,
  Users as UsersIcon,
  AlertCircle,
  CheckCircle2,
  Mail,
  Shield,
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "technician",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "technician",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "technician",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");

    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        setSuccessMsg("User profile updated successfully");
      } else {
        await createUser(formData);
        setSuccessMsg("User created successfully");
      }
      setIsFormOpen(false);
      fetchUsers();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err.message || "Failed to save user account");
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deletingUser.id);
      setSuccessMsg("User deleted successfully");
      setDeletingUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-description">
            Manage system users and access roles across operations.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} aria-hidden="true" />
          <span>Add User</span>
        </button>
      </div>

      {successMsg && (
        <div className="alert-banner alert-success" role="alert">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-danger" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>
            Retry
          </button>
        </div>
      )}

      {/* USERS TABLE */}
      <div className="content-card">
        <div className="table-wrapper">
          {loading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="skeleton-table-row">
                    <td><div className="skeleton skeleton-text" style={{ width: 40 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 130 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 170 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 90 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: 40, marginLeft: "auto" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon-wrap" aria-hidden="true">
                <UsersIcon size={24} />
              </div>
              <h3 className="empty-state-title">No users found</h3>
              <p className="empty-state-desc">
                No users have been registered yet. Click "Add User" to create the first account.
              </p>
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={14} aria-hidden="true" />
                <span>Add First User</span>
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <code style={{ color: "#64748b", fontWeight: 600 }}>#{user.id}</code>
                    </td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{user.name}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Mail size={13} color="#94a3b8" aria-hidden="true" />
                        {user.email}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`role-badge role-${user.role?.toLowerCase()}`}
                      >
                        <Shield size={11} aria-hidden="true" />
                        {user.role}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                          aria-label={`Edit ${user.name}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => setDeletingUser(user)}
                          title="Delete User"
                          aria-label={`Delete ${user.name}`}
                          style={{ color: "#dc2626" }}
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
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingUser ? "Edit User Account" : "Register New User"}
        subtitle={editingUser ? "Update profile details and operational role" : "Create a new user account for system access"}
        maxWidth="560px"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body">
            {formError && (
              <div className="alert-banner alert-danger" style={{ marginBottom: "16px" }} role="alert">
                <AlertCircle size={15} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-section-title">ACCOUNT DETAILS</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="user_name">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="user_name"
                  type="text"
                  className="form-input"
                  required
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user_role">
                  Operational Role <span className="required">*</span>
                </label>
                <select
                  id="user_role"
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="administrator">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="technician">Technician</option>
                  <option value="operator">Operator</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="user_email">
                Email Address (Unique) <span className="required">*</span>
              </label>
              <input
                id="user_email"
                type="email"
                className="form-input"
                required
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
              {formSubmitting ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={confirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to delete user "${deletingUser?.name}" (${deletingUser?.email})? This action cannot be undone.`}
        confirmText="Delete User"
        loading={deleteLoading}
      />
    </div>
  );
}
