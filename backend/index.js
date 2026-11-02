const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./utils/logger");

dotenv.config();

// The "fallback_secret" JWT default is only acceptable on a developer machine.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set when NODE_ENV=production");
}

// Comma-separated list of allowed frontend origins (e.g. https://scan2dine.vercel.app).
// When CLIENT_URL is unset every origin is allowed, which keeps local development simple.
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim().replace(/\/+$/, ""))
  : "*";

const app = express();

// Security and Logging
app.use(helmet());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors({ origin: allowedOrigins === "*" ? true : allowedOrigins }));
app.use(express.json());

// Rate Limiting (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests, please try again later." } }
});
app.use("/api/", apiLimiter);

// Import Routes
const authRoute = require("./Routes/authroute");
const menuRoute = require("./Routes/menuroute");
const publicRoute = require("./Routes/publicroute");
const orderRoute = require("./Routes/orderroute");
const qrRoute = require("./Routes/qrroute");
const analyticsRoute = require("./Routes/analyticsroute");

// Use Routes
app.use("/api/auth", authRoute);
app.use("/api/menu", menuRoute);
app.use("/api/public", publicRoute);
app.use("/api/orders", orderRoute);
app.use("/api/qr", qrRoute);
app.use("/api/analytics", analyticsRoute);

// Database connection
const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://localhost:27017/scan2dine";
    
    if (process.env.MOCK_DB === "true") {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log("Started In-Memory Mock Database!");
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully");

    // Seed Demo Data for testing
    if (process.env.MOCK_DB === "true") {
      const Restaurant = require("./Models/restaurantmodel");
      const Category = require("./Models/categorymodel");
      const MenuItem = require("./Models/menumodel");
      const bcrypt = require("bcryptjs");

      const demoExists = await Restaurant.findOne({ email: "demo@scan2dine.com" });
      if (!demoExists) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash("demo123", salt);
        
        const restaurant = await Restaurant.create({
          restaurant_name: "The Golden Dragon",
          owner_name: "Demo Owner",
          email: "demo@scan2dine.com",
          password_hash,
          phone: "123-456-7890",
          slug: "golden-dragon"
        });

        const category = await Category.create({
          restaurant_id: restaurant._id,
          name: "Signature Dishes",
          emoji_icon: "🔥",
          display_order: 1
        });

        await MenuItem.create([
          {
            restaurant_id: restaurant._id,
            category_id: category._id,
            name: "Dragon's Breath Ramen",
            description: "Spicy miso broth with handmade noodles and char siu pork.",
            price: 18.50,
            emoji_icon: "🍜",
            dietary_tags: ["Spicy"]
          },
          {
            restaurant_id: restaurant._id,
            category_id: category._id,
            name: "Golden Gyoza",
            description: "Hand-folded dumplings with a crispy lace bottom.",
            price: 12.00,
            emoji_icon: "🥟",
            dietary_tags: ["Chef's Choice"]
          }
        ]);
        console.log("Demo data seeded! Login with: demo@scan2dine.com / demo123");
      }
    }
  } catch (err) {
    console.log("Failed to connect to MongoDB", err);
  }
};

connectDB();

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Socket.io Setup
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on("join_restaurant", (restaurantId) => {
    socket.join(restaurantId);
    logger.info(`Socket ${socket.id} joined room ${restaurantId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export io so controllers can use it
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
