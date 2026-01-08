const db = require('./backend/config/db');

async function checkSchema() {
    try {
        const [rows] = await db.execute('DESCRIBE employee_requests');
        console.log('Schema for employee_requests:', rows);
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkSchema();
