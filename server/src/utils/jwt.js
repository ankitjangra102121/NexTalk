const jwt = require('jsonwebtoken');

const generateAccessToken =
(payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: '1d'
    }
  );
};

const generateRefreshToken =
(payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d'
    }
  );
};

const verifyToken =
(token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
};

const verifyRefreshToken =
(token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
};