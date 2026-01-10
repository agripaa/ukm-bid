module.exports = (sequelize, DataTypes) => {
  const Merchant = sequelize.define(
    'Merchant',
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
      business_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category_list: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      verified_documents: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      rating_cache: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      wallet_balance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
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
      tableName: 'merchants',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Merchant;
};
