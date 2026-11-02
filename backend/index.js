const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./utils/logger");
const { verifySocketToken } = require("./Middleware/authMiddleware");
const { fail } = require("./utils/http");

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

// Render, Vercel and most hosts sit behind one reverse proxy. Without this, every visitor
// appears to share the proxy's IP address and would share a single rate-limit bucket.
app.set("trust proxy", 1);

// Security and Logging
app.use(helmet());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors({ origin: allowedOrigins === "*" ? true : allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

// Rate limiting. The general limit is generous because dashboards and order-tracking pages poll.
const limiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message, error: { code: "RATE_LIMIT_EXCEEDED", message } },
  });

app.use("/api/", limiter(15 * 60 * 1000, 600, "Too many requests, please try again later."));
// Brute-force protection for logins and sign-ups, and spam protection for customer orders.
app.use("/api/auth/login", limiter(15 * 60 * 1000, 20, "Too many login attempts. Please try again in 15 minutes."));
app.use("/api/auth/register", limiter(60 * 60 * 1000, 10, "Too many sign-ups from this network. Please try again later."));
app.post("/api/public/orders", limiter(60 * 60 * 1000, 40, "You have placed too many orders recently. Please ask the staff for help."));

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

// Staff sockets authenticate with the same JWT as the REST API. The restaurant id comes from the
// verified token, so a client can never subscribe to another restaurant's live orders.
io.use(async (socket, next) => {
  socket.restaurantId = await verifySocketToken(socket.handshake.auth?.token);
  next();
});

io.on("connection", (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  socket.on("join_restaurant", () => {
    if (!socket.restaurantId) return;
    socket.join(socket.restaurantId);
    logger.info(`Socket ${socket.id} joined room ${socket.restaurantId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export io so controllers can use it
app.set("io", io);

// Unknown API routes and unexpected errors (e.g. malformed JSON) get a JSON answer, never a stack trace.
app.use("/api", (req, res) => fail(res, 404, "NOT_FOUND", "Route not found"));
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return fail(res, 400, "BAD_REQUEST", "Malformed JSON body");
  if (err.type === "entity.too.large") return fail(res, 413, "PAYLOAD_TOO_LARGE", "Request body too large");
  logger.error(err.stack || String(err));
  return fail(res, 500, "SERVER_ERROR", "Something went wrong. Please try again.");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
