const db = require('../config/db');

// --- Departments ---

exports.getDepartments = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const [rows] = await db.execute(
            'SELECT * FROM departments WHERE tenant_id = ? ORDER BY name ASC',
            [tenantId]
        );
        res.json(rows);
    } catch (error) {
        console.error('getDepartments Error:', error);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { name, parent_department_id } = req.body;

        if (!name) return res.status(400).json({ message: 'Department name is required' });

        const [result] = await db.execute(
            'INSERT INTO departments (tenant_id, name, parent_department_id) VALUES (?, ?, ?)',
            [tenantId, name, parent_department_id || null]
        );

        res.status(201).json({ id: result.insertId, name, parent_department_id });
    } catch (error) {
        console.error('createDepartment Error:', error);
        res.status(500).json({ message: 'Failed to create department' });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const departmentId = req.params.id;

        // Check for sub-departments or employees relying on this?
        // Basic query first. Foreign keys might restrict this naturally or cascade depending on DB setup.
        // Our Schema says ON DELETE SET NULL for parent_department_id, so it's safe hierarchically.
        // It says ON DELETE CASCADE for tenant_id, but what about employees?
        // job_positions -> department_id ON DELETE CASCADE.
        // employees -> job_position_id ON DELETE SET NULL.
        // So deleting a department deletes all its jobs (positions), which sets employees' positions to NULL. Safe.

        await db.execute(
            'DELETE FROM departments WHERE id = ? AND tenant_id = ?',
            [departmentId, tenantId]
        );

        res.json({ message: 'Department deleted' });
    } catch (error) {
        console.error('deleteDepartment Error:', error);
        res.status(500).json({ message: 'Failed to delete department' });
    }
};

// --- Job Positions ---

exports.getJobPositions = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        // Join with departments to get department name
        const query = `
            SELECT j.*, d.name as department_name 
            FROM job_positions j 
            LEFT JOIN departments d ON j.department_id = d.id 
            WHERE j.tenant_id = ? 
            ORDER BY j.title ASC`;

        const [rows] = await db.execute(query, [tenantId]);
        res.json(rows);
    } catch (error) {
        console.error('getJobPositions Error:', error);
        res.status(500).json({ message: 'Failed to fetch job positions' });
    }
};

exports.createJobPosition = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { title, department_id } = req.body;

        if (!title || !department_id) {
            return res.status(400).json({ message: 'Title and Department are required' });
        }

        const [result] = await db.execute(
            'INSERT INTO job_positions (tenant_id, title, department_id) VALUES (?, ?, ?)',
            [tenantId, title, department_id]
        );

        res.status(201).json({ id: result.insertId, title, department_id });
    } catch (error) {
        console.error('createJobPosition Error:', error);
        res.status(500).json({ message: 'Failed to create job position' });
    }
};

exports.deleteJobPosition = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const positionId = req.params.id;

        await db.execute(
            'DELETE FROM job_positions WHERE id = ? AND tenant_id = ?',
            [positionId, tenantId]
        );

        res.json({ message: 'Job position deleted' });
    } catch (error) {
        console.error('deleteJobPosition Error:', error);
        res.status(500).json({ message: 'Failed to delete job position' });
    }
};
