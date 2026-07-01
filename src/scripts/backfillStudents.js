/**
 * One-time backfill: create a Student profile for every User with role STUDENT
 * that is missing one. This repairs the "Student profile not found" enrollment
 * error caused by orphaned/legacy accounts.
 *
 * Usage:  npm run backfill:students
 */
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User.model");
const Student = require("../models/Student.model");
const USER_ROLES = require("../enums/userRoles");

async function backfillStudents() {
  await connectDB();

  const studentUsers = await User.find({ role: USER_ROLES.STUDENT }).select("_id name email");
  console.log(`Found ${studentUsers.length} user(s) with role STUDENT.`);

  let created = 0;
  let existing = 0;

  for (const user of studentUsers) {
    const profile = await Student.findOne({ user: user._id });
    if (profile) {
      existing++;
      continue;
    }
    try {
      await Student.create({ user: user._id });
      created++;
      console.log(`  + Created Student profile for ${user.email || user._id}`);
    } catch (err) {
      if (err?.code === 11000) {
        existing++; // created by a concurrent process
      } else {
        console.error(`  ! Failed for ${user.email || user._id}:`, err.message);
      }
    }
  }

  console.log(`\nBackfill complete: ${created} created, ${existing} already had a profile.`);
  await mongoose.connection.close();
  process.exit(0);
}

backfillStudents().catch(async (err) => {
  console.error("Backfill failed:", err);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
