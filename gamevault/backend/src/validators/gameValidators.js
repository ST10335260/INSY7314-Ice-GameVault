const { body, param, query } = require('express-validator');
const { GENRES, PLATFORMS, GAME_SORTS } = require('../config/constants');

exports.idParam = (name = 'id') => [param(name).isMongoId().withMessage(`Invalid ${name}`)];

exports.listRules = [
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1-50').toInt(),
  query('q').optional().isString().withMessage('q must be text').bail().trim().isLength({ max: 100 }),
  query('genre').optional().isIn(GENRES).withMessage('Unknown genre'),
  query('platform').optional().isIn(PLATFORMS).withMessage('Unknown platform'),
  query('sort').optional().isIn(GAME_SORTS).withMessage('Unknown sort option'),
];

const field = (name, isUpdate) => (isUpdate ? body(name).optional() : body(name));

/** Rules for creating (all required) or updating (all optional) a game. */
exports.gameRules = (isUpdate = false) => [
  field('title', isUpdate).isString().withMessage('Title is required').bail()
    .trim().isLength({ min: 1, max: 120 }).withMessage('Title must be 1-120 characters'),
  field('description', isUpdate).isString().withMessage('Description is required').bail()
    .trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  field('genre', isUpdate).isIn(GENRES).withMessage(`Genre must be one of: ${GENRES.join(', ')}`),
  field('platforms', isUpdate).isArray({ min: 1, max: PLATFORMS.length }).withMessage('Choose at least one platform'),
  body('platforms.*').isIn(PLATFORMS).withMessage('Unknown platform'),
  field('releaseYear', isUpdate).isInt({ min: 1970, max: new Date().getFullYear() + 3 })
    .withMessage('Release year is not valid').toInt(),
  body('developer').optional().isString().trim().isLength({ max: 100 }),
  body('publisher').optional().isString().trim().isLength({ max: 100 }),
  body('coverImage').optional({ values: 'falsy' })
    .isURL({ protocols: ['https'], require_protocol: true }).withMessage('Cover image must be an https:// URL'),
];
