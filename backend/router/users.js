const express = require('express');
const controller = require('../controllers/userController');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin'));
router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
