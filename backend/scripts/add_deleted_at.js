
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    let pool;
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Adding deleted_at column...');
        await pool.execute('ALTER TABLE conversation_participants ADD COLUMN deleted_at DATETIME NULL');
        console.log('Migration successful');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
        } else {
            console.error(error);
        }
    } finally {
        if (pool) await pool.end();
    }
}

migrate();
