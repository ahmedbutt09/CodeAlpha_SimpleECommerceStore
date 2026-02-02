// routes/admin.js
const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Get all users (admin only)
router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -googleId -cart")
      .sort({ createdAt: -1 });

    res.json({
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user by ID (admin only)
router.get("/users/:id", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -googleId"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user (admin only)
router.put("/users/:id", adminMiddleware, async (req, res) => {
  try {
    const { role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive },
      { new: true, runValidators: true }
    ).select("-password -googleId");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all orders (admin only)
router.get("/orders", adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "username email")
      .populate("products.productId", "name price")
      .sort({ createdAt: -1 });

    res.json({
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update order status (admin only)
// Update order status (admin only) - FIXED to handle both cases
router.put("/orders/:id/status", adminMiddleware, async (req, res) => {
  try {
    let { status } = req.body;

    // Convert to lowercase for validation
    const statusLower = status.toLowerCase();
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(statusLower)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Keep the original case or convert to proper case
    // Using proper case to match existing orders
    const statusMap = {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };

    const finalStatus = statusMap[statusLower] || status;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: finalStatus },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// Delete user (admin only) - ADD THIS ROUTE
router.delete("/users/:id", adminMiddleware, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User deleted successfully",
      deletedId: user._id,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// Get admin dashboard stats - FIXED to handle both cases
router.get("/stats", adminMiddleware, async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Get revenue (sum of all order totals) - exclude cancelled orders
    const revenueResult = await Order.aggregate([
      {
        $match: {
          $or: [
            { status: { $nin: ["Cancelled", "cancelled"] } },
            { status: { $exists: false } },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get recent orders
    const recentOrders = await Order.find()
      .populate("userId", "username")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get order status distribution - handle both cases
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: {
            $toLower: "$status", // Group by lowercase status
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      },
      recentOrders,
      orderStats,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get sales analytics - FIXED to handle both cases
router.get("/analytics", adminMiddleware, async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily sales - exclude cancelled orders
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          $or: [
            { status: { $nin: ["Cancelled", "cancelled"] } },
            { status: { $exists: false } },
          ],
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          $or: [
            { status: { $nin: ["Cancelled", "cancelled"] } },
            { status: { $exists: false } },
          ],
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // Populate product names
    const productIds = topProducts.map((item) => item._id);
    const products = await Product.find({ _id: { $in: productIds } }).select(
      "name"
    );

    const topProductsWithNames = topProducts.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item._id.toString()
      );
      return {
        ...item,
        productName: product ? product.name : "Unknown Product",
      };
    });

    res.json({
      dailySales,
      topProducts: topProductsWithNames,
      period: days,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create admin user (one-time setup)
router.post("/setup", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    // Create admin user
    const admin = new User({
      email,
      password,
      username: username || "Admin",
      role: "admin",
    });

    await admin.save();

    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
