const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

router.use(tenantMiddleware);

router.get('/', rolesController.getRoles);
router.post('/', rolesController.createRole);
router.put('/:id', rolesController.updateRole);
router.delete('/:id', rolesController.deleteRole);

// Assignment
router.post('/assign', rolesController.assignRoleToEmployee);
router.post('/remove', rolesController.removeRoleFromEmployee);
router.get('/employee/:employeeId', rolesController.getEmployeeRoles);

module.exports = router;
