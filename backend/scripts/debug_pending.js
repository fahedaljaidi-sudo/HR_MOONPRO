const db = require('../config/db');

async function debugPending() {
    console.log('--- Debugging Pending Requests ---');
    try {
        const query = `
            SELECT r.*, e.first_name, e.last_name, e.job_title, d.name as department_name
            FROM employee_requests r
            JOIN employees e ON r.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE r.status = 'PENDING'
            ORDER BY r.created_at ASC
        `;

        console.log('Running Query...');
        const [rows] = await db.execute(query);
        console.log('SUCCESS! Rows found:', rows.length);
        console.log('First row sample:', rows[0]);

    } catch (error) {
        console.error('--- QUERY FAILED ---');
        console.error(error);
    } finally {
        process.exit();
    }
}

debugPending();
