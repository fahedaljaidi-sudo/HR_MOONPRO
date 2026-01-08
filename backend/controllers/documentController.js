const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Helper: Ensure uploads dir exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Upload Document
const uploadDocument = async (req, res) => {
    try {
        const { employee_id, document_type, document_number, start_date, end_date } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!employee_id || !document_type) {
            return res.status(400).json({ error: 'Missing required fields (employee_id, document_type)' });
        }

        const filePath = `/uploads/${file.filename}`; // Rel path for frontend

        const query = `
            INSERT INTO employee_documents 
            (employee_id, document_type, document_number, start_date, end_date, file_path)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
            employee_id,
            document_type,
            document_number || null,
            start_date || null,
            end_date || null,
            filePath
        ];

        const [result] = await db.execute(query, values);

        // Fetch created record
        const [rows] = await db.execute('SELECT * FROM employee_documents WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Server error uploading document' });
    }
};

// Get Documents for Employee
const getEmployeeDocuments = async (req, res) => {
    const { employeeId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY created_at DESC`,
            [employeeId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Server error fetching documents' });
    }
};

// Delete Document
const deleteDocument = async (req, res) => {
    const { id } = req.params;
    try {
        // Get file path first
        const [rows] = await db.execute('SELECT file_path FROM employee_documents WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const filePath = rows[0].file_path;

        // Delete from DB
        await db.execute('DELETE FROM employee_documents WHERE id = ?', [id]);

        // Delete valid file from FS
        if (filePath) {
            const absolutePath = path.join(__dirname, '..', filePath);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        }

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Server error deleting document' });
    }
};

// Get Expiring Documents
const getExpiringDocuments = async (req, res) => {
    try {
        // Get all documents expiring in the next 90 days
        const query = `
            SELECT d.*, e.first_name, e.last_name 
            FROM employee_documents d
            JOIN employees e ON d.employee_id = e.id
            WHERE d.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
            ORDER BY d.end_date ASC
        `;

        const [rows] = await db.execute(query);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alerts = rows.filter(doc => {
            const endDate = new Date(doc.end_date);
            endDate.setHours(0, 0, 0, 0);

            const diffTime = endDate - today;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Logic: 
            // 1. Very close (<= 7 days) -> Always show
            // 2. Periodic (90, 80, ... 10) -> Show if daysLeft % 10 === 0

            if (daysLeft <= 7) return true;
            if (daysLeft % 10 === 0) return true;

            return false;
        }).map(doc => ({
            ...doc,
            days_left: Math.ceil((new Date(doc.end_date) - today) / (1000 * 60 * 60 * 24))
        }));

        res.json(alerts);
    } catch (error) {
        console.error('Error fetching expiring documents:', error);
        res.status(500).json({ error: 'Server error fetching alerts' });
    }
};

module.exports = {
    uploadDocument,
    getEmployeeDocuments,
    deleteDocument,
    getExpiringDocuments
};
