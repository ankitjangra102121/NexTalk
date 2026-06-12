const prisma = require('../config/db');

const MESSAGE_TYPES = ['TEXT', 'IMAGE', 'VIDEO', 'FILE', 'AUDIO'];
const MAX_MESSAGE_LENGTH = 2000;

const validateMessageInput = (conversationId, content, type) => {
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid conversationId');
  }
  const safeType = (type || 'TEXT').trim().toUpperCase();
  if (!MESSAGE_TYPES.includes(safeType)) {
    throw new Error('Invalid message type');
  }
  const safeContent = typeof content === 'string' ? content.trim() : '';
  if (safeType === 'TEXT' && !safeContent) {
    throw new Error('Message cannot be empty');
  }
  if (safeContent.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message exceeds ${MAX_MESSAGE_LENGTH} characters`);
  }
  return { safeContent, safeType };
};

const createConversation = async (userId, memberIds, type, name = null) => {
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error('Invalid members');
  }

  if (!['PRIVATE', 'GROUP'].includes(type)) {
    throw new Error('Invalid conversation type');
  }

  const uniqueMembers = [...new Set(memberIds)].filter((id) => id !== userId);

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueMembers,
      },
    },

    select: {
      id: true,
    },
  });

  if (users.length !== uniqueMembers.length) {
    throw new Error('Invalid users');
  }

  // Prevent duplicate private chat
  if (type === 'PRIVATE' && uniqueMembers.length === 1) {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'PRIVATE',

        members: {
          every: {
            userId: {
              in: [userId, uniqueMembers[0]],
            },
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
                email: true,
                profilePic: true,
              },
            },
          },
        },
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

          ...uniqueMembers.map((id) => ({
            userId: id,
          })),
        ],
      },
    },

    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePic: true,
            },
          },
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
  const { safeContent, safeType } = validateMessageInput(
    conversationId,
    content,
    type,
  );

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

      content: safeContent,

      type: safeType,
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
    const member = await prisma.conversationMember.findFirst({
      where: {
        userId,
        conversationId,
      },
    });

    if (!member) {
      throw new Error('Unauthorized access');
    }

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
  try {
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },

      select: {
        id: true,

        conversationId: true,
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const member = await prisma.conversationMember.findFirst({
      where: {
        userId,

        conversationId: message.conversationId,
      },
    });

    if (!member) {
      throw new Error('Unauthorized access');
    }

    const read = await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },

      update: {
        readAt: new Date(),
      },

      create: {
        messageId,
        userId,
      },
    });

    return read;
  } catch (error) {
    throw new Error(error.message);
  }
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
  validateMessageInput,
};
