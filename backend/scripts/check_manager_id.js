const db = require('../config/db');

(async () => {
    try {
        const [rows] = await db.execute("SHOW COLUMNS FROM employees LIKE 'manager_id'");
        if (rows.length > 0) {
            console.log("MANAGER_ID_FOUND");
        } else {
            console.log("MANAGER_ID_MISSING");
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
