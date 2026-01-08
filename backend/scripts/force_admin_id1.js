const db = require('../config/db');

async function forceAdmin() {
    try {
        const adminId = 1; // Fahad Alguaydi
        console.log(`Forcing Admin for User ID: ${adminId}`);

        // 1. Get Admin Role ID
        const [roles] = await db.execute("SELECT id FROM roles WHERE name = 'Admin'");
        if (roles.length === 0) {
            console.error('Admin role not found');
            process.exit(1);
        }
        const roleId = roles[0].id;

        // 2. Clear ALL existing admin assignments
        console.log('Clearing all admin assignments...');
        await db.execute("DELETE FROM employee_roles WHERE role_id = ?", [roleId]);

        // 3. Assign Admin to Fahad
        console.log(`Assigning Admin to ID ${adminId}...`);
        await db.execute("INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)", [adminId, roleId]);

        console.log('✅ DONE: Fahad (ID 1) is the ONLY Admin.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
forceAdmin();
