'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('payments', [
      {
        id: 1,
        order_id: 1,
        user_id: 1,
        merchant_id: 1,
        amount: 50000,
        type: 'dp',
        status: 'succeeded',
        provider_txn_id: 'TXN-DEMO-001',
        created_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('payments', { id: { [Op.in]: [1] } });
  },
};
