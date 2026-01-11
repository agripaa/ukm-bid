const { Bid, Merchant, User } = require('../models');
const createCrudController = require('./crudController');

const buildQueryOptions = (query) => {
  const { limit, offset, ...where } = query;
  const options = {};

  if (Object.keys(where).length > 0) {
    options.where = where;
  }

  if (limit !== undefined) {
    const parsedLimit = Number.parseInt(limit, 10);
    if (!Number.isNaN(parsedLimit)) {
      options.limit = parsedLimit;
    }
  }

  if (offset !== undefined) {
    const parsedOffset = Number.parseInt(offset, 10);
    if (!Number.isNaN(parsedOffset)) {
      options.offset = parsedOffset;
    }
  }

  return options;
};

const withMerchantInclude = (query) => ({
  ...buildQueryOptions(query),
  include: [
    {
      model: Merchant,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    },
  ],
});

const baseController = createCrudController(Bid);

const getAll = async (req, res) => {
  try {
    const options = withMerchantInclude(req.query);
    const records = await Bid.findAll(options);
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const record = await Bid.findByPk(req.params.id, withMerchantInclude({}));
    if (!record) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json(record);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  ...baseController,
  getAll,
  getById,
};
