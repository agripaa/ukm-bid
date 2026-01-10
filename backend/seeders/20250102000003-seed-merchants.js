'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('merchants', [
      {
        id: 1,
        user_id: 2,
        business_name: 'Budi Service',
        category_list: JSON.stringify([2, 4]),
        verified_documents: JSON.stringify({ ktp: 'https://example.com/ktp.jpg' }),
        rating_cache: 4.8,
        wallet_balance: 0.0,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('merchants', { id: { [Op.in]: [1] } });
  },
};
