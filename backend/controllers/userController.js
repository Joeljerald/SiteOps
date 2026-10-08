import pool from "../config/db.js";

// ==============================================================================
// GET ALL USERS
// WHAT IT DOES: Fetches all user records from the users table in descending order of ID.
// WHY WE NEED IT: To display the list of all registered users on the client application.
// HOW IT IS USED: GET /api/users
// ==============================================================================
export const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM users
       ORDER BY id DESC`
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================================================================
// GET USER BY ID
// WHAT IT DOES: Retrieves a single user record matching the given ID parameter.
// WHY WE NEED IT: To inspect user details or verify an existing user before an operation.
// HOW IT IS USED: GET /api/users/:id
// ==============================================================================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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

    console.error("Error fetching user by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================================================================
// CREATE USER
// WHAT IT DOES: Validates input and inserts a new user record into the database.
// WHY WE NEED IT: Allows registration of site operators, admins, and technicians.
// HOW IT IS USED: POST /api/users
// ==============================================================================
export const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email and role are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO users
        (name, email, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email, role]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    // PostgreSQL error code 23505 indicates a UNIQUE constraint violation (duplicate email)
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================================================================
// UPDATE USER
// WHAT IT DOES: Modifies the details of an existing user and refreshes updated_at.
// WHY WE NEED IT: Allows updating user profile information or changing role.
// HOW IT IS USED: PUT /api/users/:id
// ==============================================================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email and role are required",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET
         name = $1,
         email = $2,
         role = $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, email, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    // PostgreSQL error code 23505 indicates a UNIQUE constraint violation (duplicate email)
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
      });
    }

    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================================================================
// DELETE USER
// WHAT IT DOES: Deletes an existing user record matching the given ID.
// WHY WE NEED IT: Allows removing obsolete user accounts from the system.
// HOW IT IS USED: DELETE /api/users/:id
// ==============================================================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
      });
    }

    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};