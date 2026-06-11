const prisma = require('../config/db');

const createConversation = async (userId, memberIds, type, name = null) => {
  // Prevent duplicate private chat
  if (type === 'PRIVATE' && memberIds.length === 1) {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'PRIVATE',

        members: {
          every: {
            userId: {
              in: [userId, memberIds[0]],
            },
          },
        },
      },

      include: {
        members: true,
      },
    });

    if (existingConversation) {
      return existingConversation;
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      type,
      name,

      members: {
        create: [
          {
            userId,
          },

          ...memberIds.map((id) => ({
            userId: id,
          })),
        ],
      },
    },

    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  return conversation;
};

const getUserConversations = async (userId) => {
  return prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },

    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profilePic: true,
            },
          },
        },
      },

      messages: {
        orderBy: {
          createdAt: 'desc',
        },

        take: 1,
      },
    },

    orderBy: {
      updatedAt: 'desc',
    },
  });
};

const sendMessage = async (
  senderId,
  conversationId,
  content,
  type = 'TEXT',
) => {
  const member = await prisma.conversationMember.findFirst({
    where: {
      userId: senderId,

      conversationId,
    },
  });

  if (!member) {
    throw new Error('Unauthorized access');
  }

  return prisma.message.create({
    data: {
      senderId,
      conversationId,
      content,
      type,
    },

    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });
};

const getMessages = async (userId, conversationId) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },

      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages;
  } catch (error) {
    throw new Error(error.message);
  }
};

const markMessageRead = async (userId, messageId) => {
  return prisma.messageRead.create({
    data: {
      userId,
      messageId,
    },
  });
};

const deleteMessage = async (userId, messageId) => {
  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
  });

  if (!message || message.senderId !== userId) {
    throw new Error('Unauthorized');
  }

  return prisma.message.update({
    where: {
      id: messageId,
    },

    data: {
      isDeleted: true,

      content: 'Message deleted',
    },
  });
};

const searchConversations = async (userId, query) => {
  return prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },

      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
  });
};

const pinConversation = async (userId, conversationId) => {
  return prisma.conversationMember.update({
    where: {
      userId_conversationId: {
        userId,
        conversationId,
      },
    },

    data: {
      isPinned: true,
    },
  });
};

const archiveConversation = async (userId, conversationId) => {
  return prisma.conversationMember.update({
    where: {
      userId_conversationId: {
        userId,
        conversationId,
      },
    },

    data: {
      isArchived: true,
    },
  });
};

const getUserPresence = async (userId) => {
  return prisma.userPresence.findUnique({
    where: {
      userId,
    },
  });
};

const uploadMedia = async (senderId, conversationId, file) => {
  const member = await prisma.conversationMember.findFirst({
    where: {
      userId: senderId,

      conversationId,
    },
  });

  if (!member) {
    throw new Error('Unauthorized');
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      conversationId,

      type: file.mimetype.split('/')[0].toUpperCase(),
    },
  });

  await prisma.attachment.create({
    data: {
      messageId: message.id,

      fileUrl: file.path,

      fileType: file.mimetype,

      fileSize: file.size,
    },
  });

  return message;
};

const updatePresence = async (userId, isOnline, socketId = null) => {
  return prisma.userPresence.upsert({
    where: {
      userId,
    },

    update: {
      isOnline,
      socketId,

      lastSeen: isOnline ? null : new Date(),
    },

    create: {
      userId,
      isOnline,
      socketId,
    },
  });
};

const getNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
};

const markNotificationRead = async (userId, notificationId) => {
  return prisma.notification.update({
    where: {
      id: notificationId,

      userId,
    },

    data: {
      isRead: true,
    },
  });
};

module.exports = {
  createConversation,
  getUserConversations,
  sendMessage,
  getMessages,
  markMessageRead,
  deleteMessage,
  searchConversations,
  pinConversation,
  archiveConversation,
  getUserPresence,
  uploadMedia,
  updatePresence,
  getNotifications,
  markNotificationRead,
};
