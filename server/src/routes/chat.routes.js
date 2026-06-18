const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');

const chatController = require('../controllers/chat.controller');

const upload = require('../config/multer');

router.post('/conversation', authMiddleware, chatController.createConversation);

router.post(
  '/conversation/private',
  authMiddleware,
  chatController.createOrGetConversation,
);

router.get('/conversations', authMiddleware, chatController.getConversations);

router.post('/message', authMiddleware, chatController.sendMessage);

router.get(
  '/messages/:conversationId',
  authMiddleware,
  chatController.getMessages,
);

router.post('/read', authMiddleware, chatController.markRead);

router.post('/reaction', authMiddleware, chatController.reactToMessage);

router.delete(
  '/message/:messageId',
  authMiddleware,
  chatController.deleteMessage,
);
router.get('/search', authMiddleware, chatController.search);

router.post('/pin', authMiddleware, chatController.pinConversation);

router.post('/archive', authMiddleware, chatController.archiveConversation);

router.get('/presence/:userId', authMiddleware, chatController.getPresence);

router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  chatController.uploadMedia,
);

router.post('/presence', authMiddleware, chatController.updatePresence);

router.get('/notifications', authMiddleware, chatController.getNotifications);

router.post(
  '/notification/read',
  authMiddleware,
  chatController.markNotificationRead,
);

module.exports = router;
