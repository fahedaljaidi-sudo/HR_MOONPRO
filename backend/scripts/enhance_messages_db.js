const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function enhanceMessagesDB() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Updating messages table...');
        try {
            await connection.execute(`
                ALTER TABLE messages
                ADD COLUMN attachment_url TEXT DEFAULT NULL,
                ADD COLUMN attachment_type VARCHAR(50) DEFAULT NULL,
                ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE
            `);
            console.log('Added attachment columns to messages table.');
        } catch (e) {
            console.log('Columns likely already exist in messages table (Error: ' + e.message + ')');
        }

        console.log('Updating conversation_participants table...');
        try {
            await connection.execute(`
                ALTER TABLE conversation_participants
                ADD COLUMN archived_at TIMESTAMP NULL DEFAULT NULL
            `);
            console.log('Added archived_at column to conversation_participants table.');
        } catch (e) {
            console.log('Column likely already exists in conversation_participants table (Error: ' + e.message + ')');
        }

        console.log('Messages DB enhanced successfully.');
        await connection.end();
    } catch (e) {
        console.error('Error enhancing messages DB:', e);
    }
}

enhanceMessagesDB();
