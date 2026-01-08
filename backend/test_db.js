const db = require('./config/db');

async function testConnection() {
    console.log('🧪 Testing Database Connection...');
    try {
        const connection = await db.getConnection();
        console.log('✅ Connection Acquired!');

        const [rows] = await connection.query('SELECT 1 as val');
        console.log('✅ Simple Query (SELECT 1):', rows[0].val);

        await connection.beginTransaction();
        console.log('✅ Transaction Started');

        await connection.rollback();
        console.log('✅ Transaction Rolled Back');

        connection.release();
        console.log('✅ Connection Released');

        console.log('🎉 DB Test Passed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ DB Test Failed:', err);
        process.exit(1);
    }
}

testConnection();
