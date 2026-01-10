'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('disputes', [
      {
        id: 1,
        order_id: 1,
        opened_by: 'user',
        opener_id: 1,
        reason: 'Service not finished yet, requesting follow-up.',
        status: 'open',
        admin_notes: null,
        resolution: null,
        created_at: now,
        resolved_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('disputes', { id: { [Op.in]: [1] } });
  },
};
