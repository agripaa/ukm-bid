const { User } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(User);
