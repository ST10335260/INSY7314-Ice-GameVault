const router = require('express').Router();
const users = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/gameValidators');
const { roleRules } = require('../validators/userValidators');

router.use(protect, authorize('admin')); // admin only

router.get('/', users.listUsers);
router.patch('/:id/role', idParam(), roleRules, validate, users.updateRole);
router.delete('/:id', idParam(), validate, users.deleteUser);

module.exports = router;
