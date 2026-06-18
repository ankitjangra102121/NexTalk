const prisma = require('../config/db');

const chatService = require('../services/chat.service');

const createConversation = async (req, res) => {
  try {
    const { memberIds, type, name } = req.body;

    const conversation = await chatService.createConversation(
      req.user.id,
      memberIds,
      type,
      name,
    );

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createOrGetConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    const conversations = await chatService.getUserConversations(req.user.id);

    let existing = conversations.find((conversation) => {
      const members = conversation.members?.map((member) => member.userId);

      return members?.includes(req.user.id) && members?.includes(targetUserId);
    });

    if (existing) {
      return res.json({
        success: true,

        conversation: existing,
      });
    }

    const conversation = await chatService.createConversation(
      req.user.id,
      [targetUserId],
      'PRIVATE',
    );

    return res.json({
      success: true,

      conversation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getUserConversations(req.user.id);

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type } = req.body;

    const message = await chatService.sendMessage(
      req.user.id,
      conversationId,
      content,
      type,
    );

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const messages = await chatService.getMessages(
      req.user.id,
      req.params.conversationId,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markRead = async (req, res) => {
  try {
    const result = await chatService.markMessageRead(
      req.user.id,
      req.body.messageId,
    );

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const result = await chatService.deleteMessage(
      req.user.id,
      req.params.messageId,
    );

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const search = async (req, res) => {
  const result = await chatService.searchConversations(
    req.user.id,
    req.query.q,
  );

  return res.json({
    success: true,
    result,
  });
};

const pinConversation = async (req, res) => {
  const result = await chatService.pinConversation(
    req.user.id,
    req.body.conversationId,
  );

  return res.json({
    success: true,
    result,
  });
};

const archiveConversation = async (req, res) => {
  const result = await chatService.archiveConversation(
    req.user.id,
    req.body.conversationId,
  );

  return res.json({
    success: true,
    result,
  });
};

const getPresence = async (req, res) => {
  const result = await chatService.getUserPresence(req.params.userId);

  return res.json({
    success: true,
    result,
  });
};

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,

        message: 'No file uploaded',
      });
    }

    const result = await chatService.uploadMedia(
      req.user.id,
      req.body.conversationId,
      req.file,
    );

    return res.status(201).json({
      success: true,

      result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,

      message: error.message || 'Upload failed',
    });
  }
};

const updatePresence = async (req, res) => {
  const result = await chatService.updatePresence(
    req.user.id,
    req.body.isOnline,
  );

  return res.json({
    success: true,
    result,
  });
};

const getNotifications = async (req, res) => {
  const result = await chatService.getNotifications(req.user.id);

  return res.json({
    success: true,
    result,
  });
};

const markNotificationRead = async (req, res) => {
  const result = await chatService.markNotificationRead(
    req.user.id,
    req.body.notificationId,
  );

  return res.json({
    success: true,
    result,
  });
};

const reactToMessage = async (req, res) => {
  try {
    const result = await prisma.messageReaction.upsert({
      where: {
        userId_messageId_emoji: {
          userId: req.user.id,

          messageId: req.body.messageId,

          emoji: req.body.emoji,
        },
      },

      update: {},

      create: {
        userId: req.user.id,

        messageId: req.body.messageId,

        emoji: req.body.emoji,
      },
    });

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  sendMessage,
  getMessages,
  markRead,
  deleteMessage,
  search,
  pinConversation,
  archiveConversation,
  getPresence,
  uploadMedia,
  updatePresence,
  getNotifications,
  markNotificationRead,
  createOrGetConversation,
  reactToMessage,
};
