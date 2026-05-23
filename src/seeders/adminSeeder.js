const UserRepository = require("../repositories/user.repository");

const userRepository = new UserRepository();

/**
 * Seeds a default admin account if none exists in the database.
 * Called once after successful database connection on server startup.
 * Admin credentials are read from environment variables.
 */
const seedAdmin = async () => {
  try {
    // Check if any admin already exists
    const existingAdmins = await userRepository.findByRole("ADMIN");

    if (existingAdmins.length > 0) {
      console.log("✅ Admin account already exists. Skipping seed.");
      return;
    }

    // Create default admin from environment variables
    const adminData = {
      name: process.env.ADMIN_NAME || "System Administrator",
      email: process.env.ADMIN_EMAIL || "admin@wisdomwave.com",
      password: process.env.ADMIN_PASSWORD || "Admin@123",
      role: "ADMIN",
    };

    await userRepository.create(adminData);

    console.log(`✅ Admin account seeded successfully (${adminData.email})`);
  } catch (error) {
    console.error("❌ Failed to seed admin account:", error.message);
  }
};

module.exports = { seedAdmin };
