const { Category } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(Category);
