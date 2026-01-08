require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function fix() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Creating attendance table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                employee_id INT NOT NULL,
                attendance_date DATE NOT NULL,
                check_in_time DATETIME,
                check_out_time DATETIME,
                status VARCHAR(50) DEFAULT 'present',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_daily_attendance (employee_id, attendance_date),
                INDEX idx_tenant (tenant_id)
            ) ENGINE=InnoDB;
        `);
        console.log('Attendance table created successfully (or already existed).');
        await connection.end();
    } catch (e) {
        console.error('Error:', e);
    }
}

fix();
