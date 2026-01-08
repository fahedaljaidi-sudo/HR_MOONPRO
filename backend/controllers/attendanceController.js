const db = require('../config/db');

exports.getTodayStatus = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const employeeId = req.user.id; // User ID from token is Employee ID

        const today = new Date().toISOString().split('T')[0];

        // Ensure table exists (fail-safe query, though migration should handle it)
        // We use the correct column names: attendance_date, check_in_time, check_out_time
        const [rows] = await db.execute(
            'SELECT id, attendance_date as date, check_in_time as check_in, check_out_time as check_out, status FROM attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, today]
        );

        if (rows.length === 0) {
            return res.json({ status: 'out', employeeId });
        }

        const record = rows[0];
        if (record.check_out) {
            return res.json({ status: 'completed', record, employeeId });
        }

        return res.json({ status: 'in', record, employeeId });

    } catch (error) {
        console.error('getTodayStatus Error:', error);
        res.status(500).json({ message: 'Failed to fetch status' });
    }
};

exports.checkIn = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const employeeId = req.user.id;

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const [rows] = await db.execute(
            'SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, today]
        );

        if (rows.length > 0) {
            return res.status(400).json({ message: 'Already checked in for today' });
        }

        await db.execute(
            'INSERT INTO attendance (tenant_id, employee_id, attendance_date, check_in_time, status) VALUES (?, ?, ?, ?, ?)',
            [tenantId, employeeId, today, now, 'present']
        );

        res.status(201).json({ message: 'Checked in successfully', time: now });

    } catch (error) {
        console.error('checkIn Error:', error);
        res.status(500).json({ message: 'Failed to check in' });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const employeeId = req.user.id;

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        await db.execute(
            'UPDATE attendance SET check_out_time = ? WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL',
            [now, employeeId, today]
        );

        res.json({ message: 'Checked out successfully', time: now });

    } catch (error) {
        console.error('checkOut Error:', error);
        res.status(500).json({ message: 'Failed to check out' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const employeeId = req.user.id;

        const [rows] = await db.execute(
            'SELECT id, attendance_date as date, check_in_time as check_in, check_out_time as check_out, status FROM attendance WHERE employee_id = ? ORDER BY attendance_date DESC LIMIT 30',
            [employeeId]
        );
        res.json(rows);
    } catch (error) {
        console.error('getHistory Error:', error);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
};
