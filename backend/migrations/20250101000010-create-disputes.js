'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('disputes', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      opened_by: {
        type: Sequelize.ENUM('user', 'merchant'),
        allowNull: false,
      },
      opener_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('open', 'resolved', 'rejected'),
        allowNull: false,
        defaultValue: 'open',
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      resolution: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('disputes');
  },
};
