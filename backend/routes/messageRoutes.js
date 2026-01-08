const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(tenantMiddleware);

router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.startConversation);
router.put('/conversations/:conversationId/archive', messageController.archiveConversation); // Archive
router.get('/:conversationId', messageController.getMessages);
router.post('/:conversationId', upload.single('file'), messageController.sendMessage); // File upload
router.delete('/:messageId', messageController.deleteMessage); // Delete

module.exports = router;
