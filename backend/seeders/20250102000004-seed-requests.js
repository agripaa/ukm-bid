'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('requests', [
      {
        id: 1,
        user_id: 1,
        title: 'Fix leaking sink',
        description: 'Kitchen sink has a small leak under the pipe.',
        category_id: 2,
        location_lat: -6.2,
        location_lng: 106.816666,
        min_bid_amount: 150000,
        mode_service: 'teknisi',
        status: 'open',
        created_at: now,
        expires_at: nextWeek,
      },
      {
        id: 2,
        user_id: 1,
        title: 'AC service routine',
        description: 'AC needs cleaning and refill.',
        category_id: 4,
        location_lat: -6.21,
        location_lng: 106.82,
        min_bid_amount: 200000,
        mode_service: 'toko',
        status: 'open',
        created_at: now,
        expires_at: nextWeek,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('requests', { id: { [Op.in]: [1, 2] } });
  },
};
