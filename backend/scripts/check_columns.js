const db = require('../config/db');

(async () => {
    try {
        const [rows] = await db.execute('DESCRIBE employees');
        const columns = rows.map(row => ({ Field: row.Field, Type: row.Type }));
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
