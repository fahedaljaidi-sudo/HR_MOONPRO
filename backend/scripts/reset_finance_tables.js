const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function resetFinanceTables() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Dropping existing finance tables...');
        await connection.execute('DROP TABLE IF EXISTS payroll_history');
        await connection.execute('DROP TABLE IF EXISTS salaries');

        console.log('Re-creating salaries table...');
        await connection.execute(`
            CREATE TABLE salaries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                employee_id INT NOT NULL,
                base_salary DECIMAL(10, 2) DEFAULT 0.00,
                housing_allowance DECIMAL(10, 2) DEFAULT 0.00,
                transport_allowance DECIMAL(10, 2) DEFAULT 0.00,
                other_allowances DECIMAL(10, 2) DEFAULT 0.00,
                deductions DECIMAL(10, 2) DEFAULT 0.00,
                currency VARCHAR(10) DEFAULT 'SAR',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                UNIQUE KEY unique_employee_salary (employee_id)
            ) ENGINE=InnoDB;
        `);

        console.log('Re-creating payroll_history table...');
        await connection.execute(`
            CREATE TABLE payroll_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                employee_id INT NOT NULL,
                pay_period_month INT NOT NULL,
                pay_period_year INT NOT NULL,
                basic_pay DECIMAL(10, 2) NOT NULL,
                total_allowances DECIMAL(10, 2) NOT NULL,
                total_deductions DECIMAL(10, 2) NOT NULL,
                net_salary DECIMAL(10, 2) NOT NULL,
                payment_date DATE NOT NULL,
                status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        console.log('Finance tables reset successfully! Schema is now correct.');
        await connection.end();
    } catch (e) {
        console.error('Error resetting tables:', e);
    }
}

resetFinanceTables();
