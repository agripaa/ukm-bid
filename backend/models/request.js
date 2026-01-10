module.exports = (sequelize, DataTypes) => {
  const Request = sequelize.define(
    'Request',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      location_lat: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      location_lng: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      min_bid_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      mode_service: {
        type: DataTypes.ENUM('toko', 'teknisi'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'open',
          'closed',
          'in_progress',
          'completed',
          'disputed',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'open',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'requests',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Request;
};
