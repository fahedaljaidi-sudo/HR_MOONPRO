const db = require('../config/db');

async function check() {
    try {
        const [users] = await db.execute("SELECT id, first_name, last_name, email FROM employees WHERE email LIKE '%fahad%' OR email LIKE '%faleh%'");
        let roles = [];
        if (users.length > 0) {
            const ids = users.map(u => u.id).join(',');
            const [r] = await db.execute(`SELECT er.employee_id, r.name FROM employee_roles er JOIN roles r ON er.role_id = r.id WHERE er.employee_id IN (${ids})`);
            roles = r;
        }
        console.log(JSON.stringify({ users, roles }, null, 2));
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
check();
