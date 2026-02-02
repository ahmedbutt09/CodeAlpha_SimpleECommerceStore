const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Create new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products are required" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    // Validate and map payment method
    const validPaymentMethods = {
      "credit-card": "Credit Card",
      "debit-card": "Debit Card",
      cod: "Cash on Delivery",
      "bank-transfer": "Bank Transfer",
      paypal: "PayPal",
    };

    const mappedPaymentMethod =
      validPaymentMethods[paymentMethod] || "Credit Card";

    // Calculate total amount and validate products
    let totalAmount = 0;
    const productDetails = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res
          .status(404)
          .json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      totalAmount += product.price * item.quantity;

      productDetails.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.image,
      });

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Set payment status based on payment method
    const paymentStatus =
      mappedPaymentMethod === "Cash on Delivery" ? "Pending" : "Paid";

    // Create order
    const order = new Order({
      userId: req.user._id,
      products: productDetails,
      totalAmount,
      shippingAddress,
      paymentMethod: mappedPaymentMethod,
      paymentStatus: paymentStatus,
      status: "Pending",
    });

    await order.save();

    // Clear user's cart from database if exists
    try {
      await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
    } catch (cartError) {
      console.log("Note: User cart cleared from localStorage only");
    }

    res.status(201).json({
      message: "Order created successfully",
      order: {
        _id: order._id,
        userId: order.userId,
        products: order.products,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);

    // More specific error messages
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Get user's orders
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("products.productId", "name image");

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single order
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("products.productId", "name image description");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update order status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    // Basic validation
    const validStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        status,
        updatedAt: Date.now(),
        // If status is delivered and payment was COD, mark as paid
        ...(status === "Delivered" && { paymentStatus: "Paid" }),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update payment status
router.put("/:id/payment-status", authMiddleware, async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const validStatuses = ["Pending", "Paid", "Failed", "Refunded"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid payment status" });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        paymentStatus,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
