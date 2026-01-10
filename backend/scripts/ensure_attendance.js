
const db = require('../config/db');

async function checkAttendance() {
    try {
        await db.execute(`
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
        console.log('Attendance table checked/created.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAttendance();
