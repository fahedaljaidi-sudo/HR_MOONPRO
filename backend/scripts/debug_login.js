const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const email = 'mohamed@view.sa'; // From screenshot
const password = 'password123'; // Guessing default or whatever

async function testLogin() {
    try {
        console.log("Testing Login...");
        console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Exists" : "MISSING");

        const [users] = await db.execute('SELECT * FROM employees WHERE email = ?', [email]);
        console.log("User found:", users.length > 0);

        if (users.length === 0) {
            console.log("User not found.");
            return;
        }

        const user = users[0];
        console.log("User ID:", user.id);
        console.log("Password Hash:", user.password_hash ? "Exists" : "MISSING");

        if (!user.password_hash) {
            console.error("ERROR: Password hash is missing!");
            return;
        }

        // Test bcrypt
        // We don't know the real password, but let's see if compare acts up on random
        try {
            const isMatch = await bcrypt.compare('any_password', user.password_hash);
            console.log("Bcrypt compare executed successfully (result: " + isMatch + ")");
        } catch (bcryptErr) {
            console.error("Bcrypt Error:", bcryptErr);
        }

        // Test JWT
        try {
            const payload = { id: user.id, tenant_id: user.tenant_id };
            if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing");
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
            console.log("JWT Sign successful");
        } catch (jwtErr) {
            console.error("JWT Error:", jwtErr);
        }

    } catch (err) {
        console.error("General Error:", err);
    } finally {
        process.exit();
    }
}

testLogin();
