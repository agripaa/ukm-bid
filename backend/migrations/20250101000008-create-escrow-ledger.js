'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('escrow_ledger', {
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
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      held_since: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      release_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      release_policy: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      released_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('held', 'released', 'refunded'),
        allowNull: false,
        defaultValue: 'held',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('escrow_ledger');
  },
};
