const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { canEditProfile, canViewProfile } = require('../middlewares/permissionMiddleware');

router.use(tenantMiddleware);

router.get('/', employeeController.getEmployees);
// Consistently protect View Access
router.get('/:id', canViewProfile, employeeController.getEmployeeById);
router.post('/', requireAdmin, employeeController.createEmployee);
// Update: Allow Self or Admin
router.put('/:id', canEditProfile, employeeController.updateEmployee);
router.delete('/:id', requireAdmin, employeeController.deleteEmployee);

module.exports = router;
