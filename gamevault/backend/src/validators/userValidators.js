const { body } = require('express-validator');
const { ROLES, COLLECTION_STATUSES } = require('../config/constants');

exports.roleRules = [body('role').isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`)];

exports.addToCollectionRules = [
  body('gameId').isMongoId().withMessage('Invalid gameId'),
  body('status').optional().isIn(COLLECTION_STATUSES)
    .withMessage(`Status must be one of: ${COLLECTION_STATUSES.join(', ')}`),
];

exports.statusRules = [
  body('status').isIn(COLLECTION_STATUSES).withMessage(`Status must be one of: ${COLLECTION_STATUSES.join(', ')}`),
];
