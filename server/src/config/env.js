require('dotenv').config();

module.exports = {
  PORT:
    process.env.PORT,

  JWT_SECRET:
    process.env.JWT_SECRET,

  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET,

  DATABASE_URL:
    process.env.DATABASE_URL
};