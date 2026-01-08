const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

router.use(tenantMiddleware);

router.get('/', newsController.getNews);
router.post('/', newsController.createNews);

module.exports = router;
