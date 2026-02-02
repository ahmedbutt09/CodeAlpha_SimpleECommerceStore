// backend/create-admin.js
const mongoose = require("mongoose");
const User = require("./models/User");
const dotenv = require("dotenv");

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("❌ Admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      email: "admin@codealpha.com",
      password: "Admin123!", // Change this!
      username: "Admin",
      role: "admin",
    });

    await admin.save();

    console.log("✅ Admin created successfully!");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Password: Admin123! (Change this immediately!)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
