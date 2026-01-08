const express = require('express');
const router = express.Router();
const { createRequest, getMyRequests, getPendingRequests, updateRequestStatus } = require('../controllers/requestController');

const upload = require('../middlewares/uploadMiddleware');

router.post('/', upload.single('file'), createRequest);
router.get('/balance/:employeeId', require('../controllers/requestController').getLeaveBalance);
router.get('/my/:employeeId', getMyRequests);
router.get('/pending', getPendingRequests);
router.put('/:id/status', updateRequestStatus);
router.put('/:id/cancel', require('../controllers/requestController').cancelRequest);
router.put('/:id', upload.single('file'), require('../controllers/requestController').updateRequest);

module.exports = router;
