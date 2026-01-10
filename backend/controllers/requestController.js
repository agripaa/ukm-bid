const { Request } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(Request);
