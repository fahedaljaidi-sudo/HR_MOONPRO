const db = require('../config/db');

exports.getNews = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const [rows] = await db.execute(
            'SELECT * FROM company_news WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10',
            [tenantId]
        );
        res.json(rows);
    } catch (error) {
        console.error('getNews Error:', error);
        res.status(500).json({ message: 'Failed to fetch news' });
    }
};

exports.createNews = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { title, content, type, event_date } = req.body;

        if (!title) return res.status(400).json({ message: 'Title is required' });

        const [result] = await db.execute(
            'INSERT INTO company_news (tenant_id, title, content, type, event_date) VALUES (?, ?, ?, ?, ?)',
            [tenantId, title, content || '', type || 'news', event_date || null]
        );

        res.status(201).json({ id: result.insertId, title, content, type, event_date });
    } catch (error) {
        console.error('createNews Error:', error);
        res.status(500).json({ message: 'Failed to create news' });
    }
};
