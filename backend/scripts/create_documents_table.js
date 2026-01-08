const db = require('../config/db');

const createDocumentsTable = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS employee_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                document_type ENUM('CONTRACT', 'ID', 'PASSPORT', 'OTHER') NOT NULL,
                document_number VARCHAR(100),
                start_date DATE,
                end_date DATE,
                file_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        `);
        console.log('employee_documents table created successfully');
    } catch (error) {
        console.error('Error creating employee_documents table:', error);
    } finally {
        process.exit();
    }
};

createDocumentsTable();
