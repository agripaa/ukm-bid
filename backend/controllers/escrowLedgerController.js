const { EscrowLedger } = require('../models');
const createCrudController = require('./crudController');

module.exports = createCrudController(EscrowLedger);
