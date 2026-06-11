const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date(),
    memoryUsage: process.memoryUsage(),
  });
});

module.exports = router;
