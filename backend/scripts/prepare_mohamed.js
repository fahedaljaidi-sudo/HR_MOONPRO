const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function upsertUser() {
    try {
        const email = 'mohamed@view.sa';
        const password = '123';
        const firstName = 'Mohamed';
        const lastName = 'Ali';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check if user exists
        const [users] = await db.execute('SELECT * FROM employees WHERE email = ?', [email]);

        if (users.length > 0) {
            console.log('User exists. Updating password...');
            await db.execute('UPDATE employees SET password_hash = ?, is_active = 1 WHERE email = ?', [hashedPassword, email]);
            console.log('✅ Updated password for existing user: ' + email);
        } else {
            console.log('User does not exist. Creating new user...');
            // Need tenant_id. Let's assume tenant_id = 1 (since Fahad is likely tenant 1)
            // Or fetch from first available tenant or just hardcode if we are single tenant.
            // Let's safe-fetch tenant 1
            const [tenants] = await db.execute('SELECT id FROM tenants LIMIT 1');
            const tenantId = tenants.length > 0 ? tenants[0].id : 1;

            // Generate a random employee ID code
            const empCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);

            await db.execute(
                `INSERT INTO employees (tenant_id, employee_id_code, first_name, last_name, email, password_hash, is_active, phone) 
                 VALUES (?, ?, ?, ?, ?, ?, 1, '0500000000')`,
                [tenantId, empCode, firstName, lastName, email, hashedPassword]
            );
            console.log('✅ Created new user: ' + email);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

upsertUser();
