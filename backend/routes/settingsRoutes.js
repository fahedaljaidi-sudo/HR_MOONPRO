const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

router.use(tenantMiddleware);

router.get('/', settingsController.getSettings);
router.post('/update', settingsController.updateSettings);

module.exports = router;
