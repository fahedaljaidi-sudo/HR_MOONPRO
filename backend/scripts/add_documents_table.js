const db = require('../config/db');

const addDocumentsTable = async () => {
    const connection = await db.getConnection();
    try {
        console.log('Starting migration: Create documents table...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                employee_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                file_type VARCHAR(50),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                INDEX idx_employee_docs (employee_id)
            ) ENGINE=InnoDB;
        `;

        await connection.query(createTableQuery);
        console.log('Executed: Create documents table');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
};

addDocumentsTable();
