const db = require('../config/db');

async function run() {
    try {
        const [rows] = await db.execute('SELECT params FROM attendance LIMIT 5');
        // Wait, I messed up the query above in the thought process? No, I want to query * rows.
        // Let's just select * to see the data.
        const [all] = await db.execute('SELECT * FROM attendance ORDER BY id DESC LIMIT 5');
        console.log(JSON.stringify(all, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}

run();
