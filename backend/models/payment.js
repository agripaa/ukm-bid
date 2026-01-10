module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      merchant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('dp', 'final', 'refund', 'payout_fee'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'succeeded', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      provider_txn_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'payments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Payment;
};
