const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadDocument, getEmployeeDocuments, deleteDocument, getExpiringDocuments } = require('../controllers/documentController');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Ensure this directory exists (handled in controller)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/expiring', getExpiringDocuments);
router.get('/employee/:employeeId', getEmployeeDocuments);
router.delete('/:id', deleteDocument);

module.exports = router;
