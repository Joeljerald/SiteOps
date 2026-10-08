import pool from "../config/db.js";

// ==============================================================================
// GET DASHBOARD SUMMARY
// WHAT IT DOES: Calculates aggregated metrics across users, sites, and installations.
// WHY WE NEED IT: To power the executive dashboard with real PostgreSQL metrics.
// HOW IT IS USED: GET /api/dashboard/summary
// ==============================================================================
export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Total Users Count
    const totalUsersResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users`
    );

    // 2. Total Sites Count
    const totalSitesResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM sites`
    );

    // 3. Total Installations Count
    const totalInstallationsResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM installations`
    );

    // 4. Completed Installations Count
    const completedInstallationsResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM installations
       WHERE UPPER(status) = 'COMPLETED'`
    );

    // 5. Pending / Scheduled / In-Progress Installations Count
    const pendingInstallationsResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM installations
       WHERE UPPER(status) IN ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'IN PROGRESS')`
    );

    // 6. Recent Installations with Site Details via SQL JOIN
    const recentInstallationsResult = await pool.query(
      `SELECT
          installations.id,
          installations.installation_type,
          installations.status,
          installations.scheduled_date,
          installations.completion_date,
          installations.assigned_to,
          sites.site_code,
          sites.site_name,
          sites.city
       FROM installations
       JOIN sites
          ON installations.site_id = sites.id
       ORDER BY installations.created_at DESC
       LIMIT 5`
    );

    // 7. Installations Distributed by Status (GROUP BY)
    const statusDistributionResult = await pool.query(
      `SELECT
          status,
          COUNT(*) AS count
       FROM installations
       GROUP BY status
       ORDER BY count DESC`
    );

    // 8. Installations Count per Site (LEFT JOIN to include sites with 0 installations + GROUP BY)
    const siteDistributionResult = await pool.query(
      `SELECT
          sites.id,
          sites.site_code,
          sites.site_name,
          COUNT(installations.id) AS installation_count
       FROM sites
       LEFT JOIN installations
          ON sites.id = installations.site_id
       GROUP BY
          sites.id,
          sites.site_code,
          sites.site_name
       ORDER BY installation_count DESC`
    );

    res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsersResult.rows[0].total, 10),
        totalSites: parseInt(totalSitesResult.rows[0].total, 10),
        totalInstallations: parseInt(totalInstallationsResult.rows[0].total, 10),
        completedInstallations: parseInt(completedInstallationsResult.rows[0].total, 10),
        pendingInstallations: parseInt(pendingInstallationsResult.rows[0].total, 10),
        recentInstallations: recentInstallationsResult.rows,
        installationsByStatus: statusDistributionResult.rows.map((row) => ({
          status: row.status,
          count: parseInt(row.count, 10),
        })),
        installationsBySite: siteDistributionResult.rows.map((row) => ({
          id: row.id,
          site_code: row.site_code,
          site_name: row.site_name,
          installation_count: parseInt(row.installation_count, 10),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};
