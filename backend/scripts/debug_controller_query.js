
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkControllerQuery() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Exact query from controller
        const [natRows] = await pool.execute(`
            SELECT nationality as name, COUNT(*) as count 
            FROM employees 
            WHERE is_active = TRUE AND nationality IS NOT NULL
            GROUP BY nationality`
        );

        console.log('Controller Query Output:', JSON.stringify(natRows, null, 2));
        await pool.end();
    } catch (error) {
        console.error(error);
    }
}

checkControllerQuery();
