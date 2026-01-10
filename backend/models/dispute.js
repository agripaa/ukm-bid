module.exports = (sequelize, DataTypes) => {
  const Dispute = sequelize.define(
    'Dispute',
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
      opened_by: {
        type: DataTypes.ENUM('user', 'merchant'),
        allowNull: false,
      },
      opener_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('open', 'resolved', 'rejected'),
        allowNull: false,
        defaultValue: 'open',
      },
      admin_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resolution: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'disputes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Dispute;
};
