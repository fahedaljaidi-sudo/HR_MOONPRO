const db = require('../config/db');

async function debugInsert() {
    console.log('--- Starting Debug Insert ---');
    try {
        // Mock data similar to what the frontend sends
        const employee_id = 1; // Assuming employee 1 exists
        const type = 'SICK_LEAVE';
        const start_date = '2025-12-25'; // Matches today
        const end_date = '2025-12-26';
        const reason = 'Debug Test Reason';
        const amount = null;
        const details = JSON.stringify({ test: 'data' });
        const attachment_url = '/uploads/debug_file.pdf';

        console.log('Attempting INSERT with:', { employee_id, type, start_date, end_date, details, attachment_url });

        const query = `
            INSERT INTO employee_requests 
            (employee_id, type, start_date, end_date, reason, amount, details, attachment_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `;

        const [result] = await db.execute(query, [
            employee_id, type, start_date, end_date, reason, amount, details, attachment_url
        ]);

        console.log('SUCCESS! Inserted ID:', result.insertId);

    } catch (error) {
        console.error('--- INSERT FAILED ---');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);
    } finally {
        process.exit();
    }
}

debugInsert();
