
const db = require('../config/db');

async function debugNews() {
    try {
        console.log('Finding user...');
        const [users] = await db.execute("SELECT * FROM employees LIMIT 1");
        if (users.length === 0) {
            console.log("No users found.");
            process.exit(0);
        }

        const user = users[0];
        const tenantId = user.tenant_id;
        console.log(`Using Tenant ID: ${tenantId}`);

        console.log("Fetching news...");
        const [rows] = await db.execute(
            'SELECT * FROM company_news WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10',
            [tenantId]
        );
        console.log(`News count: ${rows.length}`);

        console.log("SUCCESS");
        process.exit(0);

    } catch (error) {
        console.error('DEBUG ERROR:', error);
        process.exit(1);
    }
}

debugNews();
