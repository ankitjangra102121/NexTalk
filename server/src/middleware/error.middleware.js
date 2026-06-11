const logger = require('../config/logger');

const errorMiddleware = (error, req, res, next) => {
  logger.error({
    message: error.message,
    stack: error.stack,
  });

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};

module.exports = errorMiddleware;
