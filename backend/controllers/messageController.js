const db = require('../config/db');

// List my conversations
exports.getConversations = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const employeeId = req.user.id;
        const showArchived = req.query.archived === 'true';

        // Fetch conversations the user is a participant in
        const query = `
            SELECT c.id, c.type, c.name, 
                   MAX(m.created_at) as last_message_time,
                   (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
                   (SELECT is_deleted FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_is_deleted
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE c.tenant_id = ? AND cp.employee_id = ?
            AND (
                (? = TRUE AND cp.archived_at IS NOT NULL) OR
                (? = FALSE AND cp.archived_at IS NULL)
            )
            GROUP BY c.id
            ORDER BY last_message_time DESC
        `;

        const [conversations] = await db.execute(query, [tenantId, employeeId, showArchived, showArchived]);

        const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
            if (conv.type === 'direct') {
                const [participants] = await db.execute(`
                    SELECT e.id, e.first_name, e.last_name, e.employee_id_code
                    FROM employees e
                    JOIN conversation_participants cp ON e.id = cp.employee_id
                    WHERE cp.conversation_id = ? AND e.id != ?
                `, [conv.id, employeeId]);

                if (participants.length > 0) {
                    conv.other_user = participants[0];
                    conv.name = `${participants[0].first_name} ${participants[0].last_name}`; // Override name
                }
            }
            if (conv.last_message_is_deleted) {
                conv.last_message_content = "🚫 This message was deleted";
            }
            return conv;
        }));

        res.json(enrichedConversations);
    } catch (error) {
        console.error('getConversations Error:', error);
        res.status(500).json({ message: 'Failed to fetch conversations' });
    }
};

// Start a direct conversation
exports.startConversation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const tenantId = req.user.tenant_id;
        const senderId = req.user.id;
        const { recipientId } = req.body;

        if (!recipientId) return res.status(400).json({ message: 'Recipient is required' });

        const checkQuery = `
            SELECT c.id FROM conversations c
            JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
            JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
            WHERE c.type = 'direct' AND c.tenant_id = ?
            AND cp1.employee_id = ? AND cp2.employee_id = ?
        `;
        const [existing] = await connection.execute(checkQuery, [tenantId, senderId, recipientId]);

        if (existing.length > 0) {
            // Unarchive if existing
            await connection.execute(
                'UPDATE conversation_participants SET archived_at = NULL WHERE conversation_id = ? AND employee_id = ?',
                [existing[0].id, senderId]
            );
            return res.json({ id: existing[0].id, alreadyExists: true });
        }

        await connection.beginTransaction();

        const [convResult] = await connection.execute(
            'INSERT INTO conversations (tenant_id, type) VALUES (?, ?)',
            [tenantId, 'direct']
        );
        const conversationId = convResult.insertId;

        await connection.execute(
            'INSERT INTO conversation_participants (conversation_id, employee_id) VALUES (?, ?), (?, ?)',
            [conversationId, senderId, conversationId, recipientId]
        );

        await connection.commit();

        res.json({ id: conversationId, message: 'Conversation started' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('startConversation Error:', error);
        res.status(500).json({ message: 'Failed to start conversation' });
    } finally {
        if (connection) connection.release();
    }
};

// Get Messages
exports.getMessages = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const conversationId = req.params.conversationId;

        const query = `
            SELECT m.id, m.content, m.created_at, m.sender_id, m.attachment_url, m.attachment_type, m.is_deleted,
                   e.first_name, e.last_name
            FROM messages m
            JOIN employees e ON m.sender_id = e.id
            WHERE m.conversation_id = ? AND m.tenant_id = ?
            ORDER BY m.created_at ASC
        `;
        const [rows] = await db.execute(query, [conversationId, tenantId]);

        const sanitizedRows = rows.map(msg => ({
            ...msg,
            content: msg.is_deleted ? '🚫 This message was deleted' : msg.content,
            attachment_url: msg.is_deleted ? null : msg.attachment_url
        }));

        res.json(sanitizedRows);
    } catch (error) {
        console.error('getMessages Error:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

// Send Message
exports.sendMessage = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const senderId = req.user.id;
        const conversationId = req.params.conversationId;
        const { content } = req.body;
        const file = req.file;

        if (!content && !file) return res.status(400).json({ message: 'Content or file is required' });

        const attachmentUrl = file ? `/uploads/${file.filename}` : null;
        const attachmentType = file ? file.mimetype : null;
        const messageContent = content || (file ? '📎 Attachment' : '');

        await db.execute(
            'INSERT INTO messages (tenant_id, conversation_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?, ?)',
            [tenantId, conversationId, senderId, messageContent, attachmentUrl, attachmentType]
        );

        res.json({ message: 'Message sent' });
    } catch (error) {
        console.error('sendMessage Error:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        const messageId = req.params.messageId;

        const [message] = await db.execute(
            'SELECT sender_id FROM messages WHERE id = ? AND tenant_id = ?',
            [messageId, tenantId]
        );

        if (message.length === 0) return res.status(404).json({ message: 'Message not found' });
        if (message[0].sender_id !== userId) return res.status(403).json({ message: 'Not authorized to delete this message' });

        await db.execute(
            'UPDATE messages SET is_deleted = TRUE WHERE id = ?',
            [messageId]
        );

        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('deleteMessage Error:', error);
        res.status(500).json({ message: 'Failed to delete message' });
    }
};

exports.archiveConversation = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        const conversationId = req.params.conversationId;
        const { archive } = req.body;

        const archivedAt = archive ? new Date() : null;

        await db.execute(
            'UPDATE conversation_participants SET archived_at = ? WHERE conversation_id = ? AND employee_id = ?',
            [archivedAt, conversationId, userId]
        );

        res.json({ message: archive ? 'Conversation archived' : 'Conversation unarchived' });
    } catch (error) {
        console.error('archiveConversation Error:', error);
        res.status(500).json({ message: 'Failed to update archive status' });
    }
};
