const db = require('../config/db');

exports.getRoles = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const [rows] = await db.execute('SELECT * FROM roles WHERE tenant_id = ?', [tenantId]);
        res.json(rows);
    } catch (error) {
        console.error('getRoles Error:', error);
        res.status(500).json({ message: 'Failed to fetch roles' });
    }
};

exports.createRole = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { name, description, permissions } = req.body;

        if (!name) return res.status(400).json({ message: 'Role name is required' });

        const [result] = await db.execute(
            'INSERT INTO roles (tenant_id, name, description, permissions) VALUES (?, ?, ?, ?)',
            [tenantId, name, description, JSON.stringify(permissions || [])]
        );

        res.status(201).json({ id: result.insertId, name, description, permissions });
    } catch (error) {
        console.error('createRole Error:', error);
        res.status(500).json({ message: 'Failed to create role' });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const roleId = req.params.id;
        const { name, description, permissions } = req.body;

        await db.execute(
            'UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ? AND tenant_id = ?',
            [name, description, JSON.stringify(permissions), roleId, tenantId]
        );

        res.json({ message: 'Role updated successfully' });
    } catch (error) {
        console.error('updateRole Error:', error);
        res.status(500).json({ message: 'Failed to update role' });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const roleId = req.params.id;

        await db.execute('DELETE FROM roles WHERE id = ? AND tenant_id = ?', [roleId, tenantId]);
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('deleteRole Error:', error);
        res.status(500).json({ message: 'Failed to delete role' });
    }
};

exports.assignRoleToEmployee = async (req, res) => {
    try {
        const { employeeId, roleId } = req.body;
        // Verify role belongs to tenant
        // Simplified for MVP
        await db.execute(
            'INSERT IGNORE INTO employee_roles (employee_id, role_id) VALUES (?, ?)',
            [employeeId, roleId]
        );
        res.json({ message: 'Role assigned successfully' });
    } catch (error) {
        console.error('assignRole Error:', error);
        res.status(500).json({ message: 'Failed to assign role' });
    }
};

exports.removeRoleFromEmployee = async (req, res) => {
    try {
        const { employeeId, roleId } = req.body;
        await db.execute(
            'DELETE FROM employee_roles WHERE employee_id = ? AND role_id = ?',
            [employeeId, roleId]
        );
        res.json({ message: 'Role removed successfully' });
    } catch (error) {
        console.error('removeRole Error:', error);
        res.status(500).json({ message: 'Failed to remove role' });
    }
};

exports.getEmployeeRoles = async (req, res) => {
    try {
        const employeeId = req.params.employeeId;
        const [rows] = await db.execute(`
            SELECT r.* 
            FROM roles r
            JOIN employee_roles er ON r.id = er.role_id
            WHERE er.employee_id = ?
        `, [employeeId]);
        res.json(rows);
    } catch (error) {
        console.error('getEmployeeRoles Error:', error);
        res.status(500).json({ message: 'Failed to fetch employee roles' });
    }
};
