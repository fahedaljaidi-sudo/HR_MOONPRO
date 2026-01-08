const db = require('../config/db');

const createRequestsTable = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS employee_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                type ENUM('LEAVE', 'SICK_LEAVE', 'RESIGNATION', 'NON_RENEWAL', 'LOAN', 'DOCUMENT', 'OTHER') NOT NULL,
                status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
                
                start_date DATE,
                end_date DATE,
                amount DECIMAL(10, 2),
                
                reason TEXT,
                details JSON, -- For extra metadata (e.g. document type)
                
                manager_comment TEXT,
                rejection_reason TEXT,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        `);
        console.log('employee_requests table created successfully');
    } catch (error) {
        console.error('Error creating employee_requests table:', error);
    } finally {
        process.exit();
    }
};

createRequestsTable();
