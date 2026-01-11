const express = require('express');
const apiRouter = require('./router');
const { sequelize } = require('./models');

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.get('/', (req, res) => {
  res.json({ message: 'UMKM Bid API' });
});

app.use('/api', apiRouter);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
};

startServer();
