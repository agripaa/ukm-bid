'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const scheduledAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('orders', [
      {
        id: 1,
        request_id: 1,
        bid_id: 1,
        user_id: 1,
        merchant_id: 1,
        total_price: 250000,
        dp_amount: 50000,
        status: 'dp_paid',
        scheduled_at: scheduledAt,
        proof_photos: JSON.stringify([
          { type: 'before', url: 'https://example.com/before.jpg' },
          { type: 'after', url: 'https://example.com/after.jpg' },
        ]),
        completed_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('orders', { id: { [Op.in]: [1] } });
  },
};
