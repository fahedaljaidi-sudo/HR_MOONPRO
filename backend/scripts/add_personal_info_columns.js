const db = require('../config/db');

const addPersonalInfoColumns = async () => {
    const connection = await db.getConnection();
    try {
        console.log('Starting migration: Add personal info columns to employees table...');

        // Define columns to add
        const columns = [
            "ADD COLUMN IF NOT EXISTS dob DATE",
            "ADD COLUMN IF NOT EXISTS gender VARCHAR(20)",
            "ADD COLUMN IF NOT EXISTS nationality VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS address TEXT",
            "ADD COLUMN IF NOT EXISTS national_id VARCHAR(50)"
        ];

        for (const col of columns) {
            await connection.query(`ALTER TABLE employees ${col}`);
            console.log(`Executed: ${col}`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
};

addPersonalInfoColumns();
