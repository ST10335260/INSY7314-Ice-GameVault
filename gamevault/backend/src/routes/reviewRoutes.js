const router = require('express').Router();
const { updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/gameValidators');
const { updateReviewRules } = require('../validators/reviewValidators');

router.use(protect);
router.put('/:id', idParam(), updateReviewRules, validate, updateReview);
router.delete('/:id', idParam(), validate, deleteReview);

module.exports = router;
