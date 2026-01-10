const { Dispute } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(Dispute);
