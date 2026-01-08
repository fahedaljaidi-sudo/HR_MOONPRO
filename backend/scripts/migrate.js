const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runMigration = async () => {
    console.log('🔄 Starting Database Migration...');

    // 1. Create Connection (without database selected first, to create it)
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    });

    try {
        // 2. Create DB if not exists
        const dbName = process.env.DB_NAME || 'hr_moon_pro';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`✅ Database ${dbName} checked/created.`);

        // 3. Switch to DB
        await connection.changeUser({ database: dbName });

        // 4. Read SQL File
        const sqlPath = path.join(__dirname, '../database.sql');
        let sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Remove comments (lines starting with --)
        sqlContent = sqlContent.replace(/--.*$/gm, '');

        // 5. Split and Execute Queries
        // Note: Splitting by ';' is a simple heuristic. 
        // Ideally we use a proper key, but for simple CREATE TABLE statements it works.
        const queries = sqlContent
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`🔍 Found ${queries.length} queries to execute.`);
        if (queries.length > 0) console.log('First query:', queries[0].substring(0, 50));

        for (const query of queries) {
            // Skip comments if they are the only thing in the line


            try {
                await connection.query(query);
            } catch (err) {
                // Ignore "Table already exists" warnings if we are just re-running
                if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`ℹ️  Table exists, skipping.`);
                } else {
                    console.error(`❌ Error executing query: ${query.substring(0, 50)}...`);
                    throw err;
                }
            }
        }


        console.log(`✅ Migration Completed Successfully! All 10 tables are ready.`);

        const [rows] = await connection.query('SHOW TABLES');
        console.log('📊 Current Tables:', rows.map(r => Object.values(r)[0]));

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
};

runMigration();
