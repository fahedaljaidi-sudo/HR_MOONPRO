const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

router.use(tenantMiddleware);

router.get('/', salaryController.getSalaries);
router.get('/employee/:employeeId', salaryController.getEmployeeSalary);
router.post('/update', salaryController.updateSalary);

module.exports = router;
