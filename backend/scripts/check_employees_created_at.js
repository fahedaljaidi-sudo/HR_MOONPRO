
const db = require('../config/db');

async function checkCreatedAt() {
    try {
        const [rows] = await db.execute("SHOW COLUMNS FROM employees LIKE 'created_at'");
        if (rows.length > 0) {
            console.log("✅ created_at column EXISTS in employees");
        } else {
            console.log("❌ created_at column MISSING in employees");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkCreatedAt();
