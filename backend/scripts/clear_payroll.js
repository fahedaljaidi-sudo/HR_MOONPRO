const db = require('../config/db');

async function clearPayroll() {
    try {
        const connection = await db.getConnection();
        const month = 12;
        const year = 2025;

        const [result] = await connection.execute(
            'DELETE FROM payroll_history WHERE pay_period_month = ? AND pay_period_year = ?',
            [month, year]
        );

        console.log(`Deleted ${result.affectedRows} payroll records for ${month}/${year}.`);
        console.log('You can now run payroll again.');

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Error clearing payroll:', error);
        process.exit(1);
    }
}

clearPayroll();
