// middleware/adminMiddleware.js
const authMiddleware = require("./authMiddleware");

const adminMiddleware = async (req, res, next) => {
  try {
    // First check if user is authenticated
    authMiddleware(req, res, () => {
      // Then check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }
      next();
    });
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = adminMiddleware;
