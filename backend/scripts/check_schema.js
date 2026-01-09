
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await pool.execute('DESCRIBE conversation_participants');
        console.log('Columns:', rows.map(r => r.Field));

        await pool.end();
    } catch (error) {
        console.error(error);
    }
}

checkSchema();
