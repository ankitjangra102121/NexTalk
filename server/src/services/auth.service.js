const prisma = require('../config/db');
const bcrypt = require('bcrypt');

const registerUser = async (data) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email
    }
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword
    }
  });

  return user;
};

const loginUser = async (data) => {
  const user =
    await prisma.user.findUnique({
      where: {
        email: data.email
      }
    });

  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid =
    await bcrypt.compare(
      data.password,
      user.password
    );

  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
};