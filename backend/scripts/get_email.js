const db = require('../config/db');
async function get() {
    const [rows] = await db.execute("SELECT email, first_name FROM employees WHERE first_name LIKE '%Fahad%' OR last_name LIKE '%Fahad%'");
    console.log(JSON.stringify(rows));
    process.exit(0);
}
get();
