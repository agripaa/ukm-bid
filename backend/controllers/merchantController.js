const { Merchant } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(Merchant);
