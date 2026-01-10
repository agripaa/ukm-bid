const express = require('express');
const controller = require('../controllers/categoryController');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.post('/', authenticate, authorizeRoles('admin'), controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', authenticate, authorizeRoles('admin'), controller.update);
router.delete('/:id', authenticate, authorizeRoles('admin'), controller.remove);

module.exports = router;
