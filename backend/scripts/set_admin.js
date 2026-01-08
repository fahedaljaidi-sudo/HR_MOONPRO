const db = require('../config/db');

async function setSuperAdmin() {
    try {
        console.log('--- Setting Super Admin ---');

        // 1. Find the User (Fahad)
        // Adjust email if needed, assuming user provided 'fahad@fahad.sa' or searching by name if email varies.
        // Based on user context, we look for 'fahad'
        const [users] = await db.execute("SELECT * FROM employees WHERE email LIKE '%fahad%' LIMIT 1");

        if (users.length === 0) {
            console.error('User Fahad not found!');
            process.exit(1);
        }

        const adminUser = users[0];
        console.log(`Found Admin User: ${adminUser.first_name} ${adminUser.last_name} (${adminUser.email}) - ID: ${adminUser.id}`);

        // 2. Find Admin Role
        let [roles] = await db.execute("SELECT * FROM roles WHERE name IN ('Admin', 'Manager', 'Owner') ORDER BY id ASC LIMIT 1");

        let adminRoleId;
        if (roles.length === 0) {
            console.log('Admin role not found, creating it...');
            const [res] = await db.execute("INSERT INTO roles (tenant_id, name, description, permissions) VALUES (?, 'Admin', 'Super Admin', ?)", [adminUser.tenant_id, JSON.stringify(['*'])]);
            adminRoleId = res.insertId;
        } else {
            adminRoleId = roles[0].id;
            console.log(`Found Admin Role: ${roles[0].name} - ID: ${adminRoleId}`);
        }

        // 3. WIPE all roles for everyone (Demote all)
        console.log('Clearing all existing role assignments...');
        await db.execute("DELETE FROM employee_roles");
        // Or if we want to be safer: DELETE FROM employee_roles WHERE role_id = adminRoleId

        // 4. Assign Admin Role to Fahad
        console.log(`Assigning Admin Role to User ${adminUser.id}...`);
        await db.execute("INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)", [adminUser.id, adminRoleId]);

        console.log('✅ SUCCESS: Fahad is now the ONLY Admin.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setSuperAdmin();
