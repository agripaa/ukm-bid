'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('categories', [
      {
        id: 1,
        name: 'Cleaning',
        parent_id: null,
        created_at: now,
      },
      {
        id: 2,
        name: 'Plumbing',
        parent_id: null,
        created_at: now,
      },
      {
        id: 3,
        name: 'Home Repair',
        parent_id: null,
        created_at: now,
      },
      {
        id: 4,
        name: 'AC Service',
        parent_id: 3,
        created_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('categories', { id: { [Op.in]: [1, 2, 3, 4] } });
  },
};
