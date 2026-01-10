
const db = require('../config/db');

async function checkColumns() {
    try {
        const [rows] = await db.execute("DESCRIBE employees");
        const cols = rows.map(r => r.Field);
        console.log("Employees columns:", cols);

        const required = ['tenant_id', 'is_active', 'hire_date', 'nationality', 'job_position_id'];
        const missing = required.filter(c => !cols.includes(c));

        if (missing.length > 0) {
            console.error("MISSING COLUMNS:", missing);
        } else {
            console.log("All required columns present.");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkColumns();
