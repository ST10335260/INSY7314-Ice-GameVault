const router = require('express').Router();
const me = require('../controllers/meController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/gameValidators');
const { addToCollectionRules, statusRules } = require('../validators/userValidators');

router.use(protect); // every route below requires login

router.get('/', me.getProfile);
router.get('/reviews', me.getMyReviews);

router.get('/collection', me.getCollection);
router.post('/collection', addToCollectionRules, validate, me.addToCollection);
router.patch('/collection/:gameId', idParam('gameId'), statusRules, validate, me.updateCollectionItem);
router.delete('/collection/:gameId', idParam('gameId'), validate, me.removeFromCollection);

router.get('/wishlist', me.getWishlist);
router.post('/wishlist/:gameId', idParam('gameId'), validate, me.addToWishlist);
router.delete('/wishlist/:gameId', idParam('gameId'), validate, me.removeFromWishlist);

module.exports = router;
