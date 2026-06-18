const prisma = require('../config/db');

const jwt = require('jsonwebtoken');

const chatService = require('../services/chat.service');

const connectedUsers = new Map();

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;

      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Socket connected');
    }

    socket.on('register-user', async () => {
      const userId = socket.userId;

      if (connectedUsers.has(userId)) {
        connectedUsers.delete(userId);
      }

      connectedUsers.set(userId, socket.id);

      if (process.env.NODE_ENV === 'development') {
        console.log('User online');
      }

      await prisma.userPresence.upsert({
        where: {
          userId,
        },

        update: {
          isOnline: true,

          socketId: socket.id,
        },

        create: {
          userId,

          isOnline: true,

          socketId: socket.id,
        },
      });

      io.emit('online-users', Array.from(connectedUsers.keys()));
    });

    socket.on('reconnect-user', async () => {
      const userId = socket.userId;

      connectedUsers.set(userId, socket.id);

      await prisma.userPresence.updateMany({
        where: {
          userId,
        },

        data: {
          isOnline: true,

          socketId: socket.id,
        },
      });

      io.emit('online-users', Array.from(connectedUsers.keys()));
    });

    socket.on('check-connection', () => {
      socket.emit('connection-ok', {
        socketId: socket.id,

        connected: true,
      });
    });

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('join-conversation', async (conversationId) => {
      try {
        const member = await prisma.conversationMember.findFirst({
          where: {
            userId: socket.userId,

            conversationId,
          },
        });

        if (!member) {
          return socket.emit('join-error', 'Unauthorized conversation');
        }

        socket.join(conversationId);

        if (process.env.NODE_ENV === 'development') {
          console.log('Conversation joined');
        }
      } catch {
        socket.emit('join-error', 'Failed to join conversation');
      }
    });

    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, type } = data;

        const senderId = socket.userId;

        const member = await prisma.conversationMember.findFirst({
          where: {
            userId: senderId,

            conversationId,
          },
        });

        if (!member) {
          return socket.emit('message-error', 'Unauthorized conversation');
        }

        const { safeContent, safeType } = chatService.validateMessageInput(
          conversationId,
          content,
          type,
        );

        const message = await prisma.message.create({
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

        io.to(conversationId).emit('receive-message', message);
        socket.to(conversationId).emit('conversation-unread', {
          conversationId,
          messageId: message.id,
        });
      } catch (error) {
        socket.emit('message-error', error.message);
      }
    });

    socket.on('typing', async ({ conversationId }) => {
      const member = await prisma.conversationMember.findFirst({
        where: {
          userId: socket.userId,

          conversationId,
        },
      });

      if (!member) {
        return;
      }

      socket.to(conversationId).emit('user-typing', {
        userId: socket.userId,
      });
    });

    socket.on('message-read', async ({ messageId }) => {
      try {
        const result = await chatService.markMessageRead(
          socket.userId,
          messageId,
        );

        io.emit('message-read-update', {
          messageId,
          userId: socket.userId,

          readAt: result.readAt,
        });
      } catch {
        socket.emit('message-error', 'Failed to mark message read');
      }
    });

    socket.on('stop-typing', async ({ conversationId }) => {
      const member = await prisma.conversationMember.findFirst({
        where: {
          userId: socket.userId,

          conversationId,
        },
      });

      if (!member) {
        return;
      }

      socket.to(conversationId).emit('user-stop-typing', {
        userId: socket.userId,
      });
    });

    socket.on('disconnect', async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Socket disconnected');
      }

      let userId = null;

      for (const [id, sId] of connectedUsers) {
        if (sId === socket.id) {
          userId = id;

          break;
        }
      }

      if (userId) {
        connectedUsers.delete(userId);

        await prisma.userPresence.upsert({
          where: {
            userId,
          },

          update: {
            isOnline: false,

            lastSeen: new Date(),
          },

          create: {
            userId,

            isOnline: false,

            lastSeen: new Date(),
          },
        });

        io.emit('online-users', Array.from(connectedUsers.keys()));
      }
    });
  });
};

module.exports = {
  initializeSocket,
  connectedUsers,
};
