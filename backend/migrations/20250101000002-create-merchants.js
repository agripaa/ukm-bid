'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('merchants', {
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
      business_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category_list: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      verified_documents: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      rating_cache: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      wallet_balance: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
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
    await queryInterface.dropTable('merchants');
  },
};
