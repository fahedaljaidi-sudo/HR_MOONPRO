const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

// Apply middleware to all routes
router.use(tenantMiddleware);

// Departments
router.get('/departments', orgController.getDepartments);
router.post('/departments', orgController.createDepartment);
router.delete('/departments/:id', orgController.deleteDepartment);

// Job Positions
router.get('/positions', orgController.getJobPositions);
router.post('/positions', orgController.createJobPosition);
router.delete('/positions/:id', orgController.deleteJobPosition);

module.exports = router;
