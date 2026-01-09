const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');

router.use(tenantMiddleware);

router.get('/', rolesController.getRoles);
router.post('/', requireAdmin, rolesController.createRole);
router.put('/:id', requireAdmin, rolesController.updateRole);
router.delete('/:id', requireAdmin, rolesController.deleteRole);

// Assignment
router.post('/assign', requireAdmin, rolesController.assignRoleToEmployee);
router.post('/remove', requireAdmin, rolesController.removeRoleFromEmployee);
router.get('/employee/:employeeId', rolesController.getEmployeeRoles);

module.exports = router;
