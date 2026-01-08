const db = require('../config/db');
require('dotenv').config();

async function addLeaveBalanceColumn() {
    try {
        console.log("Adding annual_leave_balance column to employees table...");

        // check if column exists first to avoid duplicate error
        const [columns] = await db.execute("SHOW COLUMNS FROM employees LIKE 'annual_leave_balance'");

        if (columns.length === 0) {
            await db.execute(`
                ALTER TABLE employees 
                ADD COLUMN annual_leave_balance INT DEFAULT 21
            `);
            console.log("SUCCESS: annual_leave_balance column added with default 21.");
        } else {
            console.log("INFO: annual_leave_balance column already exists.");
        }

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        process.exit();
    }
}

addLeaveBalanceColumn();
