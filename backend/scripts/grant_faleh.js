const db = require('../config/db');

async function grant() {
    try {
        const [users] = await db.execute("SELECT id, email FROM employees WHERE email LIKE '%faleh%'");
        if (users.length === 0) { console.log('Faleh not found'); return; }

        const userId = users[0].id;
        const [roles] = await db.execute("SELECT id FROM roles WHERE name = 'Admin'");
        const roleId = roles[0].id;

        await db.execute("INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)", [userId, roleId]);
        console.log(`Granted Admin to Faleh (${userId})`);
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
grant();
