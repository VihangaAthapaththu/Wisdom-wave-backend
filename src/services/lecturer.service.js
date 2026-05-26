const UserRepository = require("../repositories/user.repository");
const LecturerRepository = require("../repositories/lecturer.repository");
const AppError = require("../utils/AppError");
const USER_ROLES = require("../enums/userRoles");

const userRepository = new UserRepository();
const lecturerRepository = new LecturerRepository();

class LecturerService {
  /**
   * Register a new lecturer (admin-only).
   * Creates a User with LECTURER role and a linked Lecturer profile.
   * @param {Object} param0 - { name, email, password, specialization }
   * @returns {Promise<Object>} Lecturer with populated user
   */
  async registerLecturer({ name, email, password, specialization }) {
    // Check if email already exists
    const emailExists = await userRepository.existsByEmail(email);

    if (emailExists) {
      throw new AppError("An account with this email already exists.", 409);
    }

    // Create user with LECTURER role
    const user = await userRepository.create({
      name,
      email,
      password,
      role: USER_ROLES.LECTURER,
    });

    // Create lecturer profile
    const lecturer = await lecturerRepository.create({
      user: user._id,
      specialization: specialization || "",
    });

    // Return populated lecturer
    return await lecturerRepository.findById(lecturer._id);
  }

  /**
   * Get all lecturers with populated user data.
   * @returns {Promise<Array>}
   */
  async getAllLecturers() {
    return await lecturerRepository.findAll();
  }

  /**
   * Get a single lecturer by ID.
   * @param {string} lecturerId
   * @returns {Promise<Object>}
   */
  async getLecturerById(lecturerId) {
    const lecturer = await lecturerRepository.findById(lecturerId);

    if (!lecturer) {
      throw new AppError("Lecturer not found.", 404);
    }

    return lecturer;
  }

  /**
   * Get lecturer profile by user ID.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getLecturerByUserId(userId) {
    const lecturer = await lecturerRepository.findByUserId(userId);

    if (!lecturer) {
      throw new AppError("Lecturer profile not found.", 404);
    }

    return lecturer;
  }

  /**
   * Update a lecturer's profile and/or user data.
   * @param {string} lecturerId
   * @param {Object} updateData - { name?, specialization? }
   * @returns {Promise<Object>}
   */
  async updateLecturer(lecturerId, updateData) {
    const lecturer = await lecturerRepository.findById(lecturerId);

    if (!lecturer) {
      throw new AppError("Lecturer not found.", 404);
    }

    // Update user name if provided
    if (updateData.name) {
      const User = require("../models/User.model");
      await User.findByIdAndUpdate(lecturer.user._id, { name: updateData.name });
    }

    // Update lecturer-specific fields
    const lecturerUpdate = {};
    if (updateData.specialization !== undefined) {
      lecturerUpdate.specialization = updateData.specialization;
    }

    if (Object.keys(lecturerUpdate).length > 0) {
      return await lecturerRepository.update(lecturerId, lecturerUpdate);
    }

    return await lecturerRepository.findById(lecturerId);
  }

  /**
   * Deactivate a lecturer (soft delete via user.isActive).
   * @param {string} lecturerId
   * @returns {Promise<Object>}
   */
  async deactivateLecturer(lecturerId) {
    const lecturer = await lecturerRepository.findById(lecturerId);

    if (!lecturer) {
      throw new AppError("Lecturer not found.", 404);
    }

    const User = require("../models/User.model");
    await User.findByIdAndUpdate(lecturer.user._id, { isActive: false });

    return await lecturerRepository.findById(lecturerId);
  }
}

module.exports = new LecturerService();
