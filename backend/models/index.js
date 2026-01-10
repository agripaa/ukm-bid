const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

const sequelize = new Sequelize(
  envConfig.database,
  envConfig.username,
  envConfig.password,
  envConfig
);

const User = require('./user')(sequelize, DataTypes);
const Merchant = require('./merchant')(sequelize, DataTypes);
const Category = require('./category')(sequelize, DataTypes);
const Request = require('./request')(sequelize, DataTypes);
const Bid = require('./bid')(sequelize, DataTypes);
const Order = require('./order')(sequelize, DataTypes);
const Payment = require('./payment')(sequelize, DataTypes);
const EscrowLedger = require('./escrowLedger')(sequelize, DataTypes);
const Review = require('./review')(sequelize, DataTypes);
const Dispute = require('./dispute')(sequelize, DataTypes);

User.hasOne(Merchant, { foreignKey: 'user_id' });
Merchant.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Request, { foreignKey: 'category_id' });
Request.belongsTo(Category, { foreignKey: 'category_id' });

User.hasMany(Request, { foreignKey: 'user_id' });
Request.belongsTo(User, { foreignKey: 'user_id' });

Request.hasMany(Bid, { foreignKey: 'request_id' });
Bid.belongsTo(Request, { foreignKey: 'request_id' });

Merchant.hasMany(Bid, { foreignKey: 'merchant_id' });
Bid.belongsTo(Merchant, { foreignKey: 'merchant_id' });

Request.hasOne(Order, { foreignKey: 'request_id' });
Order.belongsTo(Request, { foreignKey: 'request_id' });

Bid.hasOne(Order, { foreignKey: 'bid_id' });
Order.belongsTo(Bid, { foreignKey: 'bid_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Merchant.hasMany(Order, { foreignKey: 'merchant_id' });
Order.belongsTo(Merchant, { foreignKey: 'merchant_id' });

Order.hasMany(Payment, { foreignKey: 'order_id' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

Merchant.hasMany(Payment, { foreignKey: 'merchant_id' });
Payment.belongsTo(Merchant, { foreignKey: 'merchant_id' });

Order.hasOne(EscrowLedger, { foreignKey: 'order_id' });
EscrowLedger.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasOne(Review, { foreignKey: 'order_id' });
Review.belongsTo(Order, { foreignKey: 'order_id' });

User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });

Merchant.hasMany(Review, { foreignKey: 'merchant_id' });
Review.belongsTo(Merchant, { foreignKey: 'merchant_id' });

Order.hasOne(Dispute, { foreignKey: 'order_id' });
Dispute.belongsTo(Order, { foreignKey: 'order_id' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Merchant,
  Category,
  Request,
  Bid,
  Order,
  Payment,
  EscrowLedger,
  Review,
  Dispute,
};
