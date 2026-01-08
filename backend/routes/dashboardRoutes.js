const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

router.use(tenantMiddleware);

router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
