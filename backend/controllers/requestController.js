const db = require('../config/db');

// Submit a new Request
const createRequest = async (req, res) => {
    try {
        const { employee_id, type, start_date, end_date, reason, amount, details } = req.body;
        const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

        if (!employee_id || !type || !start_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = `
            INSERT INTO employee_requests 
            (employee_id, type, start_date, end_date, reason, amount, details, attachment_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `;

        const detailsJson = details ? details : null; // Multer might parse it differently, or it comes as string if FormData

        const [result] = await db.execute(query, [
            employee_id, type, start_date, end_date || null, reason || null, amount || null, detailsJson, attachment_url
        ]);

        const [rows] = await db.execute('SELECT * FROM employee_requests WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ error: 'Server error creating request' });
    }
};

// Get My Requests
const getMyRequests = async (req, res) => {
    const { employeeId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT * FROM employee_requests WHERE employee_id = ? ORDER BY created_at DESC`,
            [employeeId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Server error fetching requests' });
    }
};

// Get Pending Requests (For Managers)
const getPendingRequests = async (req, res) => {
    try {
        // In a real app, filters by manager's team. For now, fetch all PENDING.
        const query = `
            SELECT r.*, e.first_name, e.last_name, jp.title as job_title, d.name as department_name
            FROM employee_requests r
            JOIN employees e ON r.employee_id = e.id
            LEFT JOIN job_positions jp ON e.job_position_id = jp.id
            LEFT JOIN departments d ON jp.department_id = d.id
            WHERE r.status = 'PENDING'
            ORDER BY r.created_at ASC
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: 'Server error fetching pending requests' });
    }
};

// Update Request Status (Approve/Reject)
const updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, rejection_reason, manager_comment } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // 1. Fetch request details first
        const [requestRows] = await db.execute('SELECT * FROM employee_requests WHERE id = ?', [id]);
        if (requestRows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        const request = requestRows[0];

        // 2. Handle Leave Deduction if Approved
        if (status === 'APPROVED' && request.type === 'LEAVE') {
            const startDate = new Date(request.start_date);
            const endDate = new Date(request.end_date);

            // Calculate days (inclusive)
            const diffTime = Math.abs(endDate - startDate);
            const daysRequested = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            // Check Balance
            const [empRows] = await db.execute('SELECT annual_leave_balance FROM employees WHERE id = ?', [request.employee_id]);
            const currentBalance = empRows[0].annual_leave_balance || 0;

            if (currentBalance < daysRequested) {
                return res.status(400).json({
                    error: `Insufficient leave balance. Required: ${daysRequested} days, Available: ${currentBalance} days.`
                });
            }

            // Deduct Balance
            await db.execute('UPDATE employees SET annual_leave_balance = annual_leave_balance - ? WHERE id = ?', [daysRequested, request.employee_id]);
        }

        // 3. Update Request Status
        await db.execute(
            `UPDATE employee_requests 
             SET status = ?, rejection_reason = ?, manager_comment = ? 
             WHERE id = ?`,
            [status, rejection_reason || null, manager_comment || null, id]
        );
        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ error: 'Server error updating request' });
    }
};

// Update Request Details (Edit)
const updateRequest = async (req, res) => {
    const { id } = req.params;
    try {
        const { type, start_date, end_date, reason, amount, details } = req.body;

        // 1. Check if request exists
        const [existing] = await db.execute('SELECT * FROM employee_requests WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Request not found' });

        // Optional: Block editing if not Pending
        if (existing[0].status !== 'PENDING') {
            return res.status(400).json({ error: 'Cannot edit a processed request' });
        }

        let attachment_url = existing[0].attachment_url;
        if (req.file) {
            attachment_url = `/uploads/${req.file.filename}`;
        }

        const detailsJson = details ? details : existing[0].details;

        const query = `
            UPDATE employee_requests 
            SET type = ?, start_date = ?, end_date = ?, reason = ?, amount = ?, details = ?, attachment_url = ?
            WHERE id = ?
        `;

        await db.execute(query, [
            type, start_date, end_date || null, reason || null, amount || null, detailsJson, attachment_url, id
        ]);

        const [updated] = await db.execute('SELECT * FROM employee_requests WHERE id = ?', [id]);
        res.json(updated[0]);

    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ error: 'Server error updating request' });
    }
};

// Cancel Request (User action)
const cancelRequest = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Check if request exists
        const [existing] = await db.execute('SELECT * FROM employee_requests WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Request not found' });

        // 2. Allow cancel only if PENDING
        if (existing[0].status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending requests can be cancelled' });
        }

        // 3. Update status to CANCELLED
        await db.execute('UPDATE employee_requests SET status = "CANCELLED" WHERE id = ?', [id]);

        res.json({ message: 'Request cancelled successfully' });

    } catch (error) {
        console.error('Error cancelling request:', error);
        res.status(500).json({ error: 'Server error cancelling request' });
    }
};

// Get Annual Leave Balance
const getLeaveBalance = async (req, res) => {
    const { employeeId } = req.params;
    try {
        const [rows] = await db.execute('SELECT annual_leave_balance FROM employees WHERE id = ?', [employeeId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json({ balance: rows[0].annual_leave_balance || 0 });
    } catch (error) {
        console.error('Error fetching leave balance:', error);
        res.status(500).json({ error: 'Server error fetching leave balance' });
    }
};

module.exports = {
    createRequest,
    getMyRequests,
    getPendingRequests,
    updateRequestStatus,
    updateRequest,
    cancelRequest,
    getLeaveBalance
};
