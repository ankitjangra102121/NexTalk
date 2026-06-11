const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth.middleware');

const { getUsers } = require('../controllers/user.controller');

router.get('/', auth, getUsers);

module.exports = router;
