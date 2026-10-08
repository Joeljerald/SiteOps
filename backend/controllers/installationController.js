import pool from "../config/db.js";

// ==============================================================================
// GET ALL INSTALLATIONS
// WHAT IT DOES: Fetches all installation records ordered newest-first.
// WHY WE NEED IT: To list all installations performed across sites.
// HOW IT IS USED: GET /api/installations
// ==============================================================================
export const getInstallations = async (req, res) => {
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

    let countQuery = "SELECT COUNT(*) AS total FROM installations";
    let dataQuery = "SELECT * FROM installations";
    const queryParams = [];
    const countParams = [];

    if (searchTerm) {
      const searchClause = `
       WHERE
         installation_type ILIKE $1
         OR status ILIKE $1
         OR assigned_to ILIKE $1
         OR notes ILIKE $1`;

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
    console.error("Error fetching installations:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch installations",
    });
  }
};

// ==============================================================================
// GET INSTALLATION BY ID
// WHAT IT DOES: Retrieves a single installation by its primary key ID.
// WHY WE NEED IT: To view individual installation details and status.
// HOW IT IS USED: GET /api/installations/:id
// ==============================================================================
export const getInstallationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM installations
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Installation not found",
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

    console.error("Error fetching installation:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch installation",
    });
  }
};

// ==============================================================================
// CREATE INSTALLATION
// WHAT IT DOES: Validates input and creates a new installation linked to a site.
// WHY WE NEED IT: To schedule and record installation jobs for specific sites.
// HOW IT IS USED: POST /api/installations
// ==============================================================================
export const createInstallation = async (req, res) => {
  try {
    const {
      site_id,
      installation_type,
      status,
      scheduled_date,
      completion_date,
      assigned_to,
      notes,
    } = req.body;

    // Validate required fields
    if (!site_id || !installation_type || !status) {
      return res.status(400).json({
        success: false,
        message: "Site ID, installation type and status are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO installations
        (
          site_id,
          installation_type,
          status,
          scheduled_date,
          completion_date,
          assigned_to,
          notes
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        site_id,
        installation_type,
        status,
        scheduled_date || null,
        completion_date || null,
        assigned_to || null,
        notes || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Installation created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    // PostgreSQL error code 23503 indicates a foreign key violation (site_id does not exist)
    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Site does not exist",
      });
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
      });
    }

    console.error("Error creating installation:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create installation",
    });
  }
};

// ==============================================================================
// UPDATE INSTALLATION
// WHAT IT DOES: Updates installation details and sets updated_at timestamp.
// WHY WE NEED IT: To update job status, dates, notes, or assigned personnel.
// HOW IT IS USED: PUT /api/installations/:id
// ==============================================================================
export const updateInstallation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      site_id,
      installation_type,
      status,
      scheduled_date,
      completion_date,
      assigned_to,
      notes,
    } = req.body;

    // Validate required fields
    if (!site_id || !installation_type || !status) {
      return res.status(400).json({
        success: false,
        message: "Site ID, installation type and status are required",
      });
    }

    const result = await pool.query(
      `UPDATE installations
       SET
         site_id = $1,
         installation_type = $2,
         status = $3,
         scheduled_date = $4,
         completion_date = $5,
         assigned_to = $6,
         notes = $7,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        site_id,
        installation_type,
        status,
        scheduled_date || null,
        completion_date || null,
        assigned_to || null,
        notes || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Installation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Installation updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    // PostgreSQL error code 23503 indicates a foreign key violation (site_id does not exist)
    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Site does not exist",
      });
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
      });
    }

    console.error("Error updating installation:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update installation",
    });
  }
};

// ==============================================================================
// DELETE INSTALLATION
// WHAT IT DOES: Removes an installation record matching the primary key ID.
// WHY WE NEED IT: To delete cancelled or erroneous installation records.
// HOW IT IS USED: DELETE /api/installations/:id
// ==============================================================================
export const deleteInstallation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM installations
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Installation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Installation deleted successfully",
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
      });
    }

    console.error("Error deleting installation:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete installation",
    });
  }
};
