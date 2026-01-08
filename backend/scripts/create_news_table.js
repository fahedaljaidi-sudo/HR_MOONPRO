const db = require('../config/db');

const createNewsTable = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS company_news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                type ENUM('news', 'event') DEFAULT 'news',
                event_date DATE NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            )
        `);
        console.log('company_news table created successfully');
    } catch (error) {
        console.error('Error creating company_news table:', error);
    } finally {
        process.exit();
    }
};

createNewsTable();
