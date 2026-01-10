const express = require('express');

const router = express.Router();

router.use('/users', require('./users'));
router.use('/merchants', require('./merchants'));
router.use('/categories', require('./categories'));
router.use('/requests', require('./requests'));
router.use('/bids', require('./bids'));
router.use('/orders', require('./orders'));
router.use('/payments', require('./payments'));
router.use('/escrow-ledgers', require('./escrowLedgers'));
router.use('/reviews', require('./reviews'));
router.use('/disputes', require('./disputes'));

module.exports = router;
