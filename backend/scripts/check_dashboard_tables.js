
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkDashboardTables() {
    try {
        console.log('Connecting to database...');
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const tablesToCheck = ['employees', 'attendance', 'departments', 'job_positions', 'company_news'];

        console.log('Checking tables...');
        for (const table of tablesToCheck) {
            try {
                const [rows] = await pool.execute(`DESCRIBE ${table}`);
                console.log(`✅ Table '${table}' exists.`);

                const hasTenantId = rows.some(r => r.Field === 'tenant_id');
                if (hasTenantId) {
                    console.log(`   - Has 'tenant_id' column.`);
                } else {
                    console.log(`   ❌ MISSING 'tenant_id' column!`);
                }
            } catch (error) {
                if (error.code === 'ER_NO_SUCH_TABLE') {
                    console.log(`❌ Table '${table}' DOES NOT EXIST.`);
                } else {
                    console.error(`Error checking '${table}':`, error.message);
                }
            }
        }

        await pool.end();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

checkDashboardTables();
