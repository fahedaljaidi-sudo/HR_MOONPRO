const db = require('../config/db');

exports.getSalaries = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        console.log(`[Salary Debug] Fetching salaries for Tenant: ${tenantId}`);

        // Join employees with salaries to see who has what
        const query = `
            SELECT e.id, e.first_name, e.last_name, e.employee_id_code,
                   s.base_salary, s.housing_allowance, s.transport_allowance, s.other_allowances, s.currency
            FROM employees e
            LEFT JOIN salaries s ON e.id = s.employee_id
            WHERE e.tenant_id = ?
        `;

        const [rows] = await db.execute(query, [tenantId]);
        console.log(`[Salary Debug] Found ${rows.length} records`);

        res.json(rows);
    } catch (error) {
        console.error('[Salary Debug] Error fetching salaries:', error);
        res.status(500).json({ message: 'Failed to fetch salaries', error: error.message });
    }
};

exports.getEmployeeSalary = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const employeeId = req.params.employeeId;

        const [rows] = await db.execute(
            'SELECT * FROM salaries WHERE employee_id = ? AND tenant_id = ?',
            [employeeId, tenantId]
        );

        if (rows.length === 0) {
            return res.json({}); // No salary defined yet
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('getEmployeeSalary Error:', error);
        res.status(500).json({ message: 'Failed to fetch salary details' });
    }
};

exports.updateSalary = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { employeeId, baseSalary, housingAllowance, transportAllowance, otherAllowances, deductions } = req.body;

        // Upsert logic (Insert if new, Update if exists)
        // MySQL has "INSERT ... ON DUPLICATE KEY UPDATE"

        await db.execute(`
            INSERT INTO salaries 
            (tenant_id, employee_id, base_salary, housing_allowance, transport_allowance, other_allowances, deductions)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            base_salary = VALUES(base_salary),
            housing_allowance = VALUES(housing_allowance),
            transport_allowance = VALUES(transport_allowance),
            other_allowances = VALUES(other_allowances),
            deductions = VALUES(deductions)
        `, [
            tenantId,
            employeeId,
            baseSalary || 0,
            housingAllowance || 0,
            transportAllowance || 0,
            otherAllowances || 0,
            deductions || 0
        ]);

        res.json({ message: 'Salary updated successfully' });
    } catch (error) {
        console.error('updateSalary Error:', error);
        res.status(500).json({ message: 'Failed to update salary' });
    }
};
