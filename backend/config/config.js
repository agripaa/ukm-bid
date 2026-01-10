require('dotenv').config();

const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const dbPort = parsePort(process.env.DB_PORT, 3306);

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'umkm_bid_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: dbPort,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'umkm_bid_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: dbPort,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: dbPort,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  },
};
