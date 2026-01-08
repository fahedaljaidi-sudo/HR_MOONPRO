const db = require('../config/db');

// Get all settings for the tenant
exports.getSettings = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const [rows] = await db.execute('SELECT setting_key, setting_value FROM settings WHERE tenant_id = ?', [tenantId]);

        // Convert array to object { key: value }
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        res.json(settings);
    } catch (error) {
        console.error('getSettings Error:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
};

// Update multiple settings at once
exports.updateSettings = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const tenantId = req.user.tenant_id;
        const settingsToUpdate = req.body; // Expect object { key: value, key2: value2 }

        await connection.beginTransaction();

        for (const [key, value] of Object.entries(settingsToUpdate)) {
            // Upsert (Insert or Update if exists)
            await connection.execute(`
                INSERT INTO settings (tenant_id, setting_key, setting_value)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            `, [tenantId, key, String(value)]);
        }

        await connection.commit();
        res.json({ message: 'Settings updated successfully' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('updateSettings Error:', error);
        res.status(500).json({ message: 'Failed to update settings' });
    } finally {
        if (connection) connection.release();
    }
};
