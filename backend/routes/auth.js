// routes/auth.js - Updated Google OAuth routes
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const passport = require("../config/passport");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "consent", // Changed from "select_account"
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect:
      "http://localhost:5500/frontend/pages/login.html?error=google_auth_failed",
  }),
  async (req, res) => {
    try {
      console.log("✅ Google OAuth SUCCESS for user:", req.user.email);
      console.log("✅ User ID:", req.user._id);

      const token = generateToken(req.user._id);
      const userData = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        isGoogleAccount: req.user.isGoogleAccount,
      };

      console.log(
        "✅ Token generated (first 20 chars):",
        token.substring(0, 20) + "..."
      );
      console.log("✅ User data:", userData);

      // Create the redirect URL
      const redirectUrl = `http://localhost:5500/frontend/pages/login.html?token=${token}&user=${encodeURIComponent(
        JSON.stringify(userData)
      )}`;
      console.log("✅ Redirecting to:", redirectUrl);

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      console.error("❌ Error stack:", error.stack);
      res.redirect(
        "http://localhost:5500/frontend/pages/login.html?error=" +
          encodeURIComponent(error.message)
      );
    }
  }
);

// Get Google OAuth URL (for frontend)
router.get("/google/url", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
    process.env.GOOGLE_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.GOOGLE_CALLBACK_URL
  )}&response_type=code&scope=profile%20email&access_type=offline&prompt=consent`;
  res.json({ url });
});

// Register User
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password } = req.body;

      // Check if user exists
      let user = await User.findOne({ $or: [{ email }, { username }] });
      if (user) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create new user
      user = new User({ username, email, password });
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role, // ADD THIS LINE
          isGoogleAccount: user.isGoogleAccount,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);
// Admin login endpoint
router.post(
  "/admin-login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Check if user is admin
      if (user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Access denied. Admin privileges required." });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: "Admin login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isGoogleAccount: user.isGoogleAccount,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Login User
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Check if it's a Google account
      if (user.isGoogleAccount) {
        return res.status(400).json({
          error:
            "This account uses Google Sign-In. Please use Google to login.",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role, // ADD THIS LINE
          isGoogleAccount: user.isGoogleAccount,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get Current User
router.get("/me", authMiddleware, async (req, res) => {
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

module.exports = router;
