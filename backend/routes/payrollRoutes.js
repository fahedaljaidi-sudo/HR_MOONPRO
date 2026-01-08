const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

router.use(tenantMiddleware);

router.post('/process', payrollController.processPayroll); // Keep for backward compatibility if needed, or remove.
router.post('/preview', payrollController.previewPayroll);
router.post('/confirm', payrollController.confirmPayroll);
router.get('/history', payrollController.getHistory);

module.exports = router;
