const User = require("../models/User.model");

/**
 * Data access layer for User model.
 * All database queries for users go through this repository.
 */
class UserRepository {
  /**
   * Find a user by email, including the password field.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return await User.findOne({ email }).select("+password");
  }

  /**
   * Find a user by ID (without password).
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await User.findById(id);
  }

  /**
   * Create a new user.
   * @param {Object} userData - { name, email, password, role? }
   * @returns {Promise<Object>}
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * Find users by role.
   * @param {string} role - "ADMIN" | "STUDENT" | "LECTURER"
   * @returns {Promise<Array>}
   */
  async findByRole(role) {
    return await User.find({ role });
  }

  /**
   * Check if a user with the given email already exists.
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async existsByEmail(email) {
    const user = await User.findOne({ email });
    return !!user;
  }

  /**
   * Update a user record.
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }
}

module.exports = UserRepository;
