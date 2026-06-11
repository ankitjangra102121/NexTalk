const { body } = require('express-validator');

exports.registerValidation = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required'),

  body('email')
    .isEmail()
    .withMessage('Valid email required'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

exports.loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email required'),

  body('password')
    .notEmpty()
    .withMessage('Password required')
];