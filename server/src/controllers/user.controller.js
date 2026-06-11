const prisma = require('../config/db');

const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: currentUserId,
        },
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
      },
    });

    res.json({
      success: true,

      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

module.exports = {
  getUsers,
};
