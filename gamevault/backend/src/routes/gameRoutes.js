const router = require('express').Router();
const games = require('../controllers/gameController');
const reviews = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam, listRules, gameRules } = require('../validators/gameValidators');
const { createReviewRules } = require('../validators/reviewValidators');

// Public
router.get('/', listRules, validate, games.listGames);
router.get('/:id', idParam(), validate, games.getGame);
router.get('/:id/reviews', idParam(), validate, reviews.listForGame);

// Logged-in users
router.post('/:id/reviews', protect, idParam(), createReviewRules, validate, reviews.createReview);

// Admins only (RBAC)
router.post('/', protect, authorize('admin'), gameRules(), validate, games.createGame);
router.put('/:id', protect, authorize('admin'), idParam(), gameRules(true), validate, games.updateGame);
router.delete('/:id', protect, authorize('admin'), idParam(), validate, games.deleteGame);

module.exports = router;
