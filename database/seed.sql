-- ==============================================================================
-- SITE OPERATIONS MANAGEMENT SYSTEM — DEVELOPMENT SEED DATA
-- Target Database Engine: PostgreSQL 18
-- Database Name: site_operations
-- ==============================================================================

-- 1. SEED USERS
-- Realistic field personnel, managers, and system administrators
INSERT INTO users (name, email, role)
VALUES
    ('Alice Johnson', 'alice.johnson@enabl.corp', 'admin'),
    ('Bob Martinez', 'bob.martinez@enabl.corp', 'manager'),
    ('Charlie Patel', 'charlie.patel@enabl.corp', 'technician'),
    ('Diana Chen', 'diana.chen@enabl.corp', 'technician'),
    ('Ethan Walker', 'ethan.walker@enabl.corp', 'technician')
ON CONFLICT (email) DO NOTHING;

-- 2. SEED SITES
-- Operational sites across various states and client portfolios
INSERT INTO sites (site_code, site_name, location, city, state, status, client_name)
VALUES
    ('SITE-101', 'Alpha Solar Array', 'Plot 42 Industrial Corridor', 'Phoenix', 'Arizona', 'ACTIVE', 'Apex Clean Energy'),
    ('SITE-102', 'Bayside Wind Farm', 'Pier 9 Offshore Facility', 'San Diego', 'California', 'ACTIVE', 'Pacific Power & Light'),
    ('SITE-103', 'Crestview Substation', 'Ridge Highway Km 18', 'Denver', 'Colorado', 'MAINTENANCE', 'Rocky Mountain Grid'),
    ('SITE-104', 'Delta Battery Storage', '77 Energy Way', 'Austin', 'Texas', 'ACTIVE', 'Lone Star Storage Corp'),
    ('SITE-105', 'Echo Hydro Plant', 'Cascade River Mile 14', 'Seattle', 'Washington', 'INACTIVE', 'Cascadia Hydroelectric')
ON CONFLICT (site_code) DO NOTHING;

-- 3. SEED INSTALLATIONS
-- Hardware installations dynamically resolved via site_code lookup
INSERT INTO installations (site_id, installation_type, status, scheduled_date, completion_date, assigned_to, notes)
VALUES
    (
        (SELECT id FROM sites WHERE site_code = 'SITE-101' LIMIT 1),
        'Solar Photovoltaic Inverter',
        'COMPLETED',
        '2026-08-15',
        '2026-08-18',
        'Charlie Patel',
        '50kW grid-tied central inverter installed and commissioned.'
    ),
    (
        (SELECT id FROM sites WHERE site_code = 'SITE-101' LIMIT 1),
        'Environmental Monitoring Station',
        'IN_PROGRESS',
        '2026-09-01',
        NULL,
        'Diana Chen',
        'Installing pyranometers and ambient temperature sensors.'
    ),
    (
        (SELECT id FROM sites WHERE site_code = 'SITE-102' LIMIT 1),
        'Wind Turbine Blade Sensor',
        'COMPLETED',
        '2026-07-10',
        '2026-07-12',
        'Ethan Walker',
        'Vibration and load-strain telemetric sensors active.'
    ),
    (
        (SELECT id FROM sites WHERE site_code = 'SITE-103' LIMIT 1),
        'Step-up Transformer Upgrade',
        'SCHEDULED',
        '2026-11-05',
        NULL,
        'Charlie Patel',
        'Replacement of 33kV distribution transformer during maintenance window.'
    ),
    (
        (SELECT id FROM sites WHERE site_code = 'SITE-104' LIMIT 1),
        'BESS Rack Integration',
        'SCHEDULED',
        '2026-11-20',
        NULL,
        'Diana Chen',
        'Installation of lithium-iron-phosphate battery module racks.'
    )
ON CONFLICT DO NOTHING;
