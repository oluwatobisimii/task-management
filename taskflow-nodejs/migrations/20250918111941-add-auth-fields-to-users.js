'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("users", "password", {
      type: Sequelize.STRING,
      allowNull: true, // allow null for social logins
    });

    await queryInterface.addColumn("users", "googleId", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn("users", "provider", {
      type: Sequelize.ENUM("local", "google"),
      allowNull: false,
      defaultValue: "local",
    });

    await queryInterface.addColumn("users", "refreshToken", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "lastLogin", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("users", "password");
    await queryInterface.removeColumn("users", "googleId");
    await queryInterface.removeColumn("users", "provider");
    await queryInterface.removeColumn("users", "refreshToken");
    await queryInterface.removeColumn("users", "lastLogin");

    // cleanup ENUM in Postgres to avoid "enum already exists" errors
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_provider";');
  }
};
