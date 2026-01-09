
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkNationalities() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('Connected to DB...');

        const [rows] = await pool.execute('SELECT nationality, COUNT(*) as count FROM employees GROUP BY nationality');
        console.log('Nationality Data:', rows);

        const [users] = await pool.execute('SELECT id, first_name, nationality FROM employees LIMIT 5');
        console.log('Sample Users:', users);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkNationalities();
