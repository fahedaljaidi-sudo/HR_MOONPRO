const db = require('../config/db');

const addAttachmentColumn = async () => {
    try {
        await db.execute(`
            ALTER TABLE employee_requests
            ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(255) AFTER details;
        `);
        console.log('Added attachment_url column to employee_requests table');
    } catch (error) {
        console.error('Error altering table:', error);
    } finally {
        process.exit();
    }
};

addAttachmentColumn();
