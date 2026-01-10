const { Bid } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(Bid);
