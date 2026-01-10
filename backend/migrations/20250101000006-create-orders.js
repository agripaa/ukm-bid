'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'requests',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      bid_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bids',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      merchant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'merchants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      dp_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.DATE,
        allowNull: true,
      },
      proof_photos: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  },
};
