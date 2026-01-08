const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function resetPx() {
    try {
        const email = 'fahad@fahad.sa';
        const newPass = '123456';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPass, salt);

        console.log(`Resetting password for ${email}...`);
        const [res] = await db.execute('UPDATE employees SET password_hash = ? WHERE email = ?', [hash, email]);

        if (res.affectedRows > 0) {
            console.log('SUCCESS: Password reset to 123456');
        } else {
            console.log('ERROR: User not found with email ' + email);
            // Try fallback
            const [users] = await db.execute("SELECT * FROM employees WHERE first_name LIKE '%Fahad%' LIMIT 1");
            if (users.length > 0) {
                const u = users[0];
                await db.execute('UPDATE employees SET password_hash = ? WHERE id = ?', [hash, u.id]);
                console.log(`SUCCESS: Password reset to 123456 for ${u.email} (Found by name)`);
            } else {
                console.log('ERROR: User Fahad not found at all.');
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

resetPx();
