// ==============================================================================
// CENTRALIZED FRONTEND API UTILITY
// Connects strictly to Express REST APIs using VITE_API_URL.
// Does NOT touch or contain PostgreSQL credentials.
// ==============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      const netError = new Error("Unable to connect to the backend server. Please verify backend is running on port 5000.");
      netError.status = 0;
      throw netError;
    }
    throw err;
  }
};

// ==============================================================================
// USERS API
// ==============================================================================
export const getUsers = () => request("/users");
export const getUserById = (id) => request(`/users/${id}`);
export const createUser = (userData) =>
  request("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
export const updateUser = (id, userData) =>
  request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
export const deleteUser = (id) =>
  request(`/users/${id}`, {
    method: "DELETE",
  });

// ==============================================================================
// SITES API (with real pagination and ILIKE search)
// ==============================================================================
export const getSites = ({ page = 1, limit = 10, search = "" } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search && search.trim()) params.append("search", search.trim());
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/sites${query}`);
};
export const getSiteById = (id) => request(`/sites/${id}`);
export const createSite = (siteData) =>
  request("/sites", {
    method: "POST",
    body: JSON.stringify(siteData),
  });
export const updateSite = (id, siteData) =>
  request(`/sites/${id}`, {
    method: "PUT",
    body: JSON.stringify(siteData),
  });
export const deleteSite = (id) =>
  request(`/sites/${id}`, {
    method: "DELETE",
  });

// ==============================================================================
// INSTALLATIONS API (with real pagination and ILIKE search)
// ==============================================================================
export const getInstallations = ({ page = 1, limit = 10, search = "" } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search && search.trim()) params.append("search", search.trim());
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/installations${query}`);
};
export const getInstallationById = (id) => request(`/installations/${id}`);
export const createInstallation = (installData) =>
  request("/installations", {
    method: "POST",
    body: JSON.stringify(installData),
  });
export const updateInstallation = (id, installData) =>
  request(`/installations/${id}`, {
    method: "PUT",
    body: JSON.stringify(installData),
  });
export const deleteInstallation = (id) =>
  request(`/installations/${id}`, {
    method: "DELETE",
  });

// ==============================================================================
// DASHBOARD API (Real PostgreSQL Aggregates)
// ==============================================================================
export const getDashboardSummary = () => request("/dashboard/summary");
