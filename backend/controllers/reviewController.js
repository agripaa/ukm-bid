const { Review } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(Review);
