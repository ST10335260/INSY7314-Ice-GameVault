const { body } = require('express-validator');

exports.registerRules = [
  body('username')
    .isString().withMessage('Username is required').bail()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username may only contain letters, numbers and underscores'),
  body('email')
    .isString().withMessage('Email is required').bail()
    .trim().isEmail().withMessage('A valid email is required').bail()
    .isLength({ max: 254 }).toLowerCase(),
  body('password')
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[a-z]/).withMessage('Password needs a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password needs an uppercase letter')
    .matches(/\d/).withMessage('Password needs a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password needs a special character'),
];

exports.loginRules = [
  body('email').isString().withMessage('A valid email is required').bail()
    .trim().isEmail().withMessage('A valid email is required').bail().toLowerCase(),
  body('password').isString().withMessage('Password is required').bail()
    .notEmpty().withMessage('Password is required'),
];
