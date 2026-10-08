import pool from "../config/db.js";

// ==============================================================================
// GET ALL SITES
// WHAT IT DOES: Fetches all site records from the sites table ordered newest-first.
// WHY WE NEED IT: To list all operational project sites in the system.
// HOW IT IS USED: GET /api/sites
// ==============================================================================
export const getSites = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedPage) ||
      parsedPage <= 0 ||
      !Number.isInteger(parsedLimit) ||
      parsedLimit <= 0 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be valid positive integers",
      });
    }

    const offset = (parsedPage - 1) * parsedLimit;
    const searchTerm = typeof search === "string" ? search.trim() : "";

    let countQuery = "SELECT COUNT(*) AS total FROM sites";
    let dataQuery = "SELECT * FROM sites";
    const queryParams = [];
    const countParams = [];

    if (searchTerm) {
      const searchClause = `
       WHERE
         site_code ILIKE $1
         OR site_name ILIKE $1
         OR location ILIKE $1
         OR city ILIKE $1
         OR state ILIKE $1
         OR client_name ILIKE $1`;

      countQuery += searchClause;
      dataQuery += searchClause;

      countParams.push(`%${searchTerm}%`);
      queryParams.push(`%${searchTerm}%`);
    }

    dataQuery += `
       ORDER BY id DESC
       LIMIT $${queryParams.length + 1}
       OFFSET $${queryParams.length + 2}`;

    queryParams.push(parsedLimit, offset);

    const countResult = await pool.query(countQuery, countParams);
    const dataResult = await pool.query(dataQuery, queryParams);

    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = total === 0 ? 0 : Math.ceil(total / parsedLimit);

    res.status(200).json({
      success: true,
      count: dataResult.rows.length,
      data: dataResult.rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching sites:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sites",
    });
  }
};

// ==============================================================================
// GET SITE BY ID
// WHAT IT DOES: Retrieves a single site record matching the primary key ID.
// WHY WE NEED IT: To view individual site details and verify existence.
// HOW IT IS USED: GET /api/sites/:id
// ==============================================================================
export const getSiteById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM sites
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
      });
    }

    console.error("Error fetching site:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch site",
    });
  }
};

// ==============================================================================
// CREATE SITE
// WHAT IT DOES: Validates input and inserts a new site record into the database.
// WHY WE NEED IT: To register new client work sites.
// HOW IT IS USED: POST /api/sites
// ==============================================================================
export const createSite = async (req, res) => {
  try {
    const {
      site_code,
      site_name,
      location,
      city,
      state,
      status,
      client_name,
    } = req.body;

    // Validate required fields
    if (!site_code || !site_name || !status) {
      return res.status(400).json({
        success: false,
        message: "Site code, site name and status are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO sites
        (site_code, site_name, location, city, state, status, client_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        site_code,
        site_name,
        location || null,
        city || null,
        state || null,
        status,
        client_name || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Site created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    // PostgreSQL error code 23505 indicates a UNIQUE constraint violation (duplicate site_code)
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Site code already exists",
      });
    }

    console.error("Error creating site:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create site",
    });
  }
};

// ==============================================================================
// UPDATE SITE
// WHAT IT DOES: Updates site details and automatically sets updated_at timestamp.
// WHY WE NEED IT: To update site status, location, client information, or details.
// HOW IT IS USED: PUT /api/sites/:id
// ==============================================================================
export const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      site_code,
      site_name,
      location,
      city,
      state,
      status,
      client_name,
    } = req.body;

    // Validate required fields
    if (!site_code || !site_name || !status) {
      return res.status(400).json({
        success: false,
        message: "Site code, site name and status are required",
      });
    }

    const result = await pool.query(
      `UPDATE sites
       SET
         site_code = $1,
         site_name = $2,
         location = $3,
         city = $4,
         state = $5,
         status = $6,
         client_name = $7,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        site_code,
        site_name,
        location || null,
        city || null,
        state || null,
        status,
        client_name || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Site updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    // PostgreSQL error code 23505 indicates a UNIQUE constraint violation (duplicate site_code)
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Site code already exists",
      });
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
      });
    }

    console.error("Error updating site:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update site",
    });
  }
};

// ==============================================================================
// DELETE SITE
// WHAT IT DOES: Deletes an existing site record matching the ID.
// WHY WE NEED IT: To decommission or remove a site record.
// HOW IT IS USED: DELETE /api/sites/:id
// ==============================================================================
export const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM sites
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Site deleted successfully",
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
      });
    }

    console.error("Error deleting site:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete site",
    });
  }
};