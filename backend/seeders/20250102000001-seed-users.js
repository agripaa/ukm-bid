'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const passwordHash = bcrypt.hashSync('password123', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'Siti User',
        email: 'user@example.com',
        password: passwordHash,
        phone: '081234567890',
        role: 'user',
        location_lat: -6.2,
        location_lng: 106.816666,
        address: 'Jakarta',
        verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: 'Budi Merchant',
        email: 'merchant@example.com',
        password: passwordHash,
        phone: '081234567891',
        role: 'merchant',
        location_lat: -6.914744,
        location_lng: 107.60981,
        address: 'Bandung',
        verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        name: 'Admin User',
        email: 'admin@example.com',
        password: passwordHash,
        phone: '081234567892',
        role: 'admin',
        location_lat: null,
        location_lng: null,
        address: null,
        verified: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('users', { id: { [Op.in]: [1, 2, 3] } });
  },
};
