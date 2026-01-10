const { Order } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(Order);
