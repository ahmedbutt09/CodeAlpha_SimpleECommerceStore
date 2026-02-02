const mongoose = require("mongoose");
require("dotenv").config();

// We need to go up one level to access backend/models
const path = require("path");
const Product = require(path.join(__dirname, "../backend/models/Product"));

const products = [
  {
    name: "iPhone 15 Pro",
    description:
      "Latest iPhone with A17 Pro chip and titanium design, featuring a professional camera system and all-day battery life.",
    price: 999.99,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop",
    stock: 50,
  },
  {
    name: "Nike Air Max 270",
    description:
      "Comfortable running shoes with Max Air cushioning for all-day comfort and modern style.",
    price: 129.99,
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    stock: 100,
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    description:
      "Wireless noise-cancelling headphones with exceptional sound quality and 30-hour battery life.",
    price: 299.99,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    stock: 75,
  },
  {
    name: "Premium Leather Jacket",
    description:
      "Genuine leather jacket for men with classic design and perfect fit for all seasons.",
    price: 199.99,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop",
    stock: 30,
  },
  {
    name: "Python Programming Guide",
    description:
      "Complete guide to Python programming with practical examples and projects for beginners to advanced.",
    price: 49.99,
    category: "Books",
    image:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop",
    stock: 200,
  },
  {
    name: "Smart Coffee Maker",
    description:
      "Automatic coffee maker with timer, programmable settings, and built-in grinder for fresh coffee.",
    price: 89.99,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
    stock: 40,
  },
  {
    name: "Premium Yoga Mat",
    description:
      "Non-slip yoga mat with carrying strap, perfect for all types of yoga and fitness activities.",
    price: 34.99,
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=300&fit=crop",
    stock: 150,
  },
  {
    name: "Smart Watch Pro",
    description:
      "Fitness tracker with heart rate monitor, GPS, sleep tracking, and smartphone notifications.",
    price: 249.99,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    stock: 60,
  },
  {
    name: "4K Ultra HD TV",
    description:
      "55-inch 4K Smart TV with HDR, streaming apps, and voice control features.",
    price: 599.99,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop",
    stock: 25,
  },
  {
    name: "Wireless Gaming Mouse",
    description:
      "High-precision wireless gaming mouse with customizable RGB lighting and long battery life.",
    price: 79.99,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop",
    stock: 120,
  },
  {
    name: "Cotton T-Shirt Pack",
    description:
      "Pack of 3 premium cotton t-shirts in various colors, comfortable for everyday wear.",
    price: 29.99,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop",
    stock: 300,
  },
  {
    name: "Cookware Set",
    description:
      "10-piece non-stick cookware set including pots, pans, and utensils for complete kitchen.",
    price: 149.99,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    stock: 45,
  },
];

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Load environment variables from backend/.env
    const dotenv = require("dotenv");
    dotenv.config({ path: path.join(__dirname, "../backend/.env") });

    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce_db";
    console.log(`🔗 Connecting to MongoDB: ${mongoURI}`);

    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB database");

    // Clear existing products
    const deletedCount = await Product.deleteMany({});
    console.log(`✅ Cleared ${deletedCount.deletedCount} existing products`);

    // Insert new products
    const result = await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${result.length} products`);

    // Get total count
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);

    // List all categories
    const categories = [...new Set(products.map((p) => p.category))];
    console.log("🏷️  Available categories:", categories.join(", "));

    // Display sample data
    console.log("\n📋 Sample of seeded products:");
    console.log("=".repeat(50));
    result.slice(0, 3).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Stock: ${product.stock} units`);
      console.log("");
    });

    // Disconnect from database
    await mongoose.disconnect();
    console.log("✅ Disconnected from database");
    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
