'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const releaseAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('escrow_ledger', [
      {
        id: 1,
        order_id: 1,
        amount: 50000,
        held_since: now,
        release_at: releaseAt,
        release_policy: 'Release after service completion confirmation.',
        released_to: null,
        status: 'held',
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('escrow_ledger', { id: { [Op.in]: [1] } });
  },
};
