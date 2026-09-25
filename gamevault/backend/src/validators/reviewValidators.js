const { body } = require('express-validator');

const comment = body('comment').optional().isString().withMessage('Comment must be text').bail()
  .trim().isLength({ max: 1000 }).withMessage('Comment can be at most 1000 characters');

exports.createReviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number from 1 to 5').toInt(),
  comment,
];

exports.updateReviewRules = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number from 1 to 5').toInt(),
  comment,
];
