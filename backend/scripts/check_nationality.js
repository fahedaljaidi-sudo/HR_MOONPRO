const db = require('../config/db');

async function checkSchema() {
    try {
        const [columns] = await db.execute("SHOW COLUMNS FROM employees LIKE 'nationality'");
        console.log("Columns found:", columns);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
