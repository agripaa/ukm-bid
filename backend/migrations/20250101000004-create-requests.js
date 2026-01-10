'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requests', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      location_lat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      location_lng: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      min_bid_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      mode_service: {
        type: Sequelize.ENUM('toko', 'teknisi'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('requests');
  },
};
