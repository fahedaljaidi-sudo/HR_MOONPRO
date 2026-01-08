const db = require('../config/db');

async function find() {
    try {
        const [users] = await db.execute("SELECT id, first_name, last_name, email FROM employees WHERE first_name LIKE '%Fahad%' OR last_name LIKE '%Fahad%' OR last_name LIKE '%Alguaydi%'");
        users.forEach(u => console.log(`User: ${u.first_name} ${u.last_name} | ID: ${u.id} | Email: ${u.email}`));
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
find();
