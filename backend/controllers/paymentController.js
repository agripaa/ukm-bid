const { Payment } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(Payment);
