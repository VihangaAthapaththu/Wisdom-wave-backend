const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/user.repository");
const AppError = require("../utils/AppError");

const userRepository = new UserRepository();

class AuthService {
  /**
   * Register a new user.
   * @param {Object} param0 - { name, email, password }
   * @returns {Promise<Object>} Created user (without password)
   */
  async register({ name, email, password }) {
    // Check if email already exists
    const emailExists = await userRepository.existsByEmail(email);

    if (emailExists) {
      throw new AppError("An account with this email already exists.", 409);
    }

    // Create user
    const user = await userRepository.create({ name, email, password });

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    return userObj;
  }

  /**
   * Authenticate a user and generate JWT.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login(email, password) {
    // Find user with password
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Please contact support.",
        403
      );
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    // Generate token
    const token = this.generateToken(user._id);

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, token };
  }

  /**
   * Generate a JWT token.
   * @param {string} userId
   * @returns {string} JWT token
   */
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "1d",
    });
  }

  /**
   * Get the current authenticated user's profile.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return user;
  }
}

module.exports = new AuthService();
