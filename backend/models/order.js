module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      request_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bid_id: {
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
      total_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      dp_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'dp_paid',
          'in_progress',
          'awaiting_confirmation',
          'completed',
          'refunded',
          'disputed'
        ),
        allowNull: false,
      },
      scheduled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      proof_photos: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Order;
};
