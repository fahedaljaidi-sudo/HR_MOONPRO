const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

router.use(tenantMiddleware);

router.get('/status', attendanceController.getTodayStatus);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/history', attendanceController.getHistory);

module.exports = router;
