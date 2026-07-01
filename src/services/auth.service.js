const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserRepository = require("../repositories/user.repository");
const StudentRepository = require("../repositories/student.repository");
const AppError = require("../utils/AppError");
const USER_ROLES = require("../enums/userRoles");
const { sendEmail } = require("./email.service");
const { passwordResetEmail } = require("../utils/emailTemplates");

const userRepository = new UserRepository();
const studentRepository = new StudentRepository();

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

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
    const user = await userRepository.create({
      name,
      email,
      password,
      role: USER_ROLES.STUDENT,
    });

    await studentRepository.create({ user: user._id });

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
   * Request a password reset. Generates a token, stores its hash + expiry on the
   * user, and emails a reset link. Always resolves without revealing whether the
   * email exists (prevents account enumeration).
   * @param {string} email
   */
  async requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) return; // silent — no enumeration

    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = hashToken(rawToken);
    const resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    await userRepository.update(user._id, { resetPasswordToken, resetPasswordExpires });

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
    const ctaUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    const { subject, html } = passwordResetEmail({ name: user.name, ctaUrl });
    await sendEmail({ to: user.email, subject, html });
  }

  /**
   * Reset a password using a raw token from the emailed link.
   * @param {string} rawToken
   * @param {string} newPassword
   */
  async resetPassword(rawToken, newPassword) {
    if (!rawToken) throw new AppError("Invalid or expired reset link.", 400);

    const user = await userRepository.findByResetToken(hashToken(rawToken));
    if (!user) throw new AppError("Invalid or expired reset link.", 400);

    // Setting password triggers the pre-save hook which hashes it
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: "Password reset successfully. You can now log in." };
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
