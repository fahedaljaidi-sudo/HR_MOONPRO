
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkTenants() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [users] = await pool.execute('SELECT id, first_name, email, tenant_id FROM employees WHERE email LIKE "%fahad%" OR id = 1');
        console.log('User(s):', users);

        if (users.length > 0) {
            const tenantId = users[0].tenant_id;
            console.log(`Checking employees for tenant_id: ${tenantId}`);

            const [rows] = await pool.execute(`
                SELECT nationality, COUNT(*) as count 
                FROM employees 
                WHERE tenant_id = ? AND is_active = TRUE AND nationality IS NOT NULL 
                GROUP BY nationality`,
                [tenantId]
            );
            console.log('Distribution for this tenant:', rows);
        }

        await pool.end();
    } catch (error) {
        console.error(error);
    }
}

checkTenants();
