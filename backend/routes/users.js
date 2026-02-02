// routes/users.js - Update addresses endpoints
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Address = require("../models/Address"); // ADD THIS LINE
const authMiddleware = require("../middleware/authMiddleware");

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update user profile
router.put(
  "/profile",
  authMiddleware,
  [
    body("username")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("phone")
      .optional()
      .matches(/^[+]?[0-9\s\-\(\)]{10,15}$/)
      .withMessage("Valid phone number is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, phone } = req.body;
      const updateData = {};

      // Check if email already exists (if updating email)
      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: "Email already exists" });
        }
        updateData.email = email;
      }

      // Check if username already exists (if updating username)
      if (username && username !== req.user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }
        updateData.username = username;
      }

      // Update phone if provided
      if (phone !== undefined) {
        updateData.phone = phone;
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user: user,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Change password
router.post(
  "/change-password",
  authMiddleware,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Check if new password is same as old
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({
          error: "New password must be different from current password",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get user addresses
router.get("/addresses", authMiddleware, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single address
router.get("/addresses/:id", authMiddleware, async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json(address);
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add new address
router.post(
  "/addresses",
  authMiddleware,
  [
    body("label").notEmpty().withMessage("Address label is required"),
    body("streetAddress").notEmpty().withMessage("Street address is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("zipCode").notEmpty().withMessage("ZIP code is required"),
    body("country").notEmpty().withMessage("Country is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { label, streetAddress, city, zipCode, country, isDefault } =
        req.body;

      // If this address is set as default, unset all other defaults
      if (isDefault) {
        await Address.updateMany(
          { userId: req.user._id },
          { $set: { isDefault: false } }
        );
      }

      // Create new address
      const address = new Address({
        userId: req.user._id,
        label,
        streetAddress,
        city,
        zipCode,
        country,
        isDefault: isDefault || false,
      });

      await address.save();

      res.status(201).json({
        message: "Address added successfully",
        address,
      });
    } catch (error) {
      console.error("Error adding address:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update address
router.put(
  "/addresses/:id",
  authMiddleware,
  [
    body("label")
      .optional()
      .notEmpty()
      .withMessage("Address label is required"),
    body("streetAddress")
      .optional()
      .notEmpty()
      .withMessage("Street address is required"),
    body("city").optional().notEmpty().withMessage("City is required"),
    body("zipCode").optional().notEmpty().withMessage("ZIP code is required"),
    body("country").optional().notEmpty().withMessage("Country is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { label, streetAddress, city, zipCode, country, isDefault } =
        req.body;

      // Check if address exists and belongs to user
      const address = await Address.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }

      // If setting as default, unset all other defaults
      if (isDefault && !address.isDefault) {
        await Address.updateMany(
          { userId: req.user._id, _id: { $ne: req.params.id } },
          { $set: { isDefault: false } }
        );
      }

      // Update address
      const updateData = {};
      if (label !== undefined) updateData.label = label;
      if (streetAddress !== undefined) updateData.streetAddress = streetAddress;
      if (city !== undefined) updateData.city = city;
      if (zipCode !== undefined) updateData.zipCode = zipCode;
      if (country !== undefined) updateData.country = country;
      if (isDefault !== undefined) updateData.isDefault = isDefault;

      const updatedAddress = await Address.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.json({
        message: "Address updated successfully",
        address: updatedAddress,
      });
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete address
router.delete("/addresses/:id", authMiddleware, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // If deleted address was default, set another address as default
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ userId: req.user._id });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    res.json({
      message: "Address deleted successfully",
      deletedId: address._id, // Send back the deleted ID
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Set address as default
router.put("/addresses/:id/set-default", authMiddleware, async (req, res) => {
  try {
    // Unset all other defaults
    await Address.updateMany(
      { userId: req.user._id },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json({
      message: "Address set as default successfully",
      address,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
