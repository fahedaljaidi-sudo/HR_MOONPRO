const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper to generate next Employee ID
const generateEmployeeId = async (tenantId) => {
    // Advanced unique ID generation
    // Extract the numeric part (substring after 'EMP-') and find MAX
    const query = `
        SELECT MAX(CAST(SUBSTRING(employee_id_code, 5) AS UNSIGNED)) as maxNum 
        FROM employees 
        WHERE tenant_id = ?
    `;
    const [rows] = await db.execute(query, [tenantId]);

    let nextNum = 1;
    if (rows.length > 0 && rows[0].maxNum) {
        nextNum = rows[0].maxNum + 1;
    }

    return `EMP-${String(nextNum).padStart(3, '0')}`;
};

exports.getEmployees = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const query = `
            SELECT e.*,
                   j.title as job_title, d.name as department_name
            FROM employees e
            LEFT JOIN job_positions j ON e.job_position_id = j.id
            LEFT JOIN departments d ON j.department_id = d.id
            WHERE e.tenant_id = ?
            ORDER BY e.created_at DESC`;

        const [rows] = await db.execute(query, [tenantId]);
        res.json(rows);
    } catch (error) {
        console.error('getEmployees Error:', error);
        res.status(500).json({ message: 'Failed to fetch employees' });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const employeeId = req.params.id;

        const query = `
            SELECT e.*, 
                   j.title as job_title, 
                   d.name as department_name,
                   m.first_name as manager_first, m.last_name as manager_last
            FROM employees e
            LEFT JOIN job_positions j ON e.job_position_id = j.id
            LEFT JOIN departments d ON j.department_id = d.id
            LEFT JOIN employees m ON e.manager_id = m.id
            WHERE e.id = ? AND e.tenant_id = ?`;

        const [rows] = await db.execute(query, [employeeId, tenantId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Don't send password hash
        const employee = rows[0];
        delete employee.password_hash;

        res.json(employee);
    } catch (error) {
        console.error('getEmployeeById Error:', error);
        res.status(500).json({ message: 'Failed to fetch employee details' });
    }
};

exports.createEmployee = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const tenantId = req.user.tenant_id;
        const { firstName, lastName, email, phone, jobPositionId, hireDate, manager_id } = req.body;

        if (!firstName || !lastName || !email || !jobPositionId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check email uniqueness
        const [existing] = await connection.execute(
            'SELECT id FROM employees WHERE tenant_id = ? AND email = ?',
            [tenantId, email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already exists in this workspace' });
        }

        const employeeIdCode = await generateEmployeeId(tenantId);
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = 'password123'; // Default password
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        await connection.beginTransaction();

        const [result] = await connection.execute(
            `INSERT INTO employees 
            (tenant_id, employee_id_code, first_name, last_name, email, password_hash, phone, job_position_id, hire_date, is_active, manager_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tenantId, employeeIdCode, firstName, lastName, email, hashedPassword, phone, jobPositionId, hireDate || new Date(), true, manager_id || null]
        );

        // Optional: Assign "Employee" role if it exists? 
        // For now, we skip role assignment to keep it simple, they are just "users"

        await connection.commit();

        res.status(201).json({
            id: result.insertId,
            firstName,
            lastName,
            email,
            employeeIdCode,
            message: 'Employee created successfully. Default password: password123'
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('createEmployee Error:', error);

        try {
            const fs = require('fs');
            fs.appendFileSync('backend_error.log', new Date().toISOString() + ' - ' + error.message + '\n' + error.stack + '\n\n');
        } catch (logErr) { console.error("Logging failed", logErr); }

        res.status(500).json({ message: 'Failed to create employee: ' + error.message, error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateEmployee = async (req, res) => {
    const fs = require('fs');
    const logFile = 'C:/Users/gamin/New project/backend/backend_debug.log';
    const log = (msg) => { try { fs.appendFileSync(logFile, new Date().toISOString() + ': ' + msg + '\n'); } catch (e) { } };

    try {
        log('Update Init. Params: ' + JSON.stringify(req.params) + ' Body: ' + JSON.stringify(req.body));
        const tenantId = req.user.tenant_id;
        const employeeId = req.params.id;
        const updates = req.body;

        // Map frontend keys to database columns
        const fieldMap = {
            firstName: 'first_name',
            lastName: 'last_name',
            email: 'email',
            phone: 'phone',
            jobPositionId: 'job_position_id',
            dob: 'dob',
            gender: 'gender',
            nationality: 'nationality',
            address: 'address',
            nationalId: 'national_id',
            is_active: 'is_active',
            manager_id: 'manager_id'
        };

        const setClauses = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (fieldMap[key]) {
                const dbCol = fieldMap[key];
                let val = updates[key];

                // Sanitize empty strings to NULL
                if (val === '' || val === 'null') val = null;

                setClauses.push(`${dbCol} = ?`);
                values.push(val);
            }
        });

        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const query = `UPDATE employees SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`;
        values.push(employeeId, tenantId);

        await db.execute(query, values);

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        if (typeof log !== 'undefined') log('EXCEPTION: ' + error.message + '\n' + error.stack);
        console.error('updateEmployee Error:', error);
        res.status(500).json({ message: 'Failed to update employee: ' + error.message, error: error.message });
    }
};


exports.deleteEmployee = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const employeeId = req.params.id;

        const [result] = await db.execute(
            'DELETE FROM employees WHERE id = ? AND tenant_id = ?',
            [employeeId, tenantId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('deleteEmployee Error:', error);
        res.status(500).json({ message: 'Failed to delete employee' });
    }
};
