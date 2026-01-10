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

const createCrudController = (model) => ({
  create: async (req, res) => {
    try {
      const record = await model.create(req.body);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const options = buildQueryOptions(req.query);
      const records = await model.findAll(options);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const record = await model.findByPk(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const record = await model.findByPk(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Not found' });
      }
      await record.update(req.body);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  remove: async (req, res) => {
    try {
      const record = await model.findByPk(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Not found' });
      }
      await record.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },
});

module.exports = createCrudController;
