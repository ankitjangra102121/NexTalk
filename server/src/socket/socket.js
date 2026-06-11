const prisma = require('../config/db');
const chatService = require('../services/chat.service');

const connectedUsers = new Map();

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(
      `⚡ User connected:
        ${socket.id}`,
    );

    // Register User
    socket.on('register-user', async (userId) => {
      if (connectedUsers.has(userId)) {
        connectedUsers.delete(userId);
      }

      connectedUsers.set(userId, socket.id);
      console.log(
        `User online:
  ${userId}`,
      );
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

    socket.on('reconnect-user', async (userId) => {
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

    // Join Chat Room
    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);

      console.log(
        `Joined room:
            ${conversationId}`,
      );
    });

    // socket.on('send-message', async (data) => {
    //   try {
    //     const { senderId, conversationId, content, type } = data;

    //     const message = {
    //       senderId,
    //       conversationId,
    //       content,
    //       type,
    //     };

    //     console.log('Real-time message:', message);

    //     // Send message to room
    //     io.to(conversationId).emit('receive-message', message);

    //     // Real-time notification
    //     const members = await prisma.conversationMember.findMany({
    //       where: {
    //         conversationId,

    //         userId: {
    //           not: senderId,
    //         },
    //       },
    //     });

    //     for (const member of members) {
    //       const socketId = connectedUsers.get(member.userId);

    //       if (socketId) {
    //         io.to(socketId).emit('new-notification', {
    //           title: 'New Message',

    //           message: content,

    //           conversationId,

    //           senderId,
    //         });

    //         const count = await prisma.notification.count({
    //           where: {
    //             userId: member.userId,

    //             isRead: false,
    //           },
    //         });

    //         io.to(socketId).emit('notification-count', count);
    //       }
    //     }
    //   } catch (error) {
    //     socket.emit('message-error', error.message);
    //   }
    // });
    
    socket.on('send-message', async (data) => {
      try {
        const { senderId, conversationId, content, type } = data;

        const message = await prisma.message.create({
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

        io.to(conversationId).emit('receive-message', message);
      } catch (error) {
        console.log(error);

        socket.emit('message-error', error.message);
      }
    });

    socket.on('typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user-typing', {
        userId,
      });
    });

    socket.on('stop-typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user-stop-typing', {
        userId,
      });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(
        `❌ User disconnected:
            ${socket.id}`,
      );

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
