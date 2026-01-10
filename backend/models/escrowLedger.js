module.exports = (sequelize, DataTypes) => {
  const EscrowLedger = sequelize.define(
    'EscrowLedger',
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
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      held_since: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      release_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      release_policy: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      released_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('held', 'released', 'refunded'),
        allowNull: false,
        defaultValue: 'held',
      },
    },
    {
      tableName: 'escrow_ledger',
      timestamps: false,
    }
  );

  return EscrowLedger;
};
