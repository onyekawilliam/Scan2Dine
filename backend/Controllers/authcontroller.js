const Restaurant = require("../Models/restaurantmodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

const registerRestaurant = async (req, res) => {
  try {
    const { restaurant_name, owner_name, email, password, phone } = req.body;

    const restaurantExists = await Restaurant.findOne({ email });

    if (restaurantExists) {
      return res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Restaurant email already exists",
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const slug = restaurant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

    const restaurant = await Restaurant.create({
      restaurant_name,
      owner_name,
      email,
      password_hash,
      phone,
      slug
    });

    if (restaurant) {
      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: {
          user: {
            id: restaurant._id,
            restaurant_name: restaurant.restaurant_name,
            email: restaurant.email,
            slug: restaurant.slug,
          },
          token: generateToken(restaurant._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid restaurant data" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginRestaurant = async (req, res) => {
  try {
    const { email, password } = req.body;

    const restaurant = await Restaurant.findOne({ email });

    if (restaurant && (await bcrypt.compare(password, restaurant.password_hash))) {
      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: restaurant._id,
            restaurant_name: restaurant.restaurant_name,
            email: restaurant.email,
            slug: restaurant.slug,
          },
          token: generateToken(restaurant._id),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.id).select("-password_hash");
    
    if (restaurant) {
      res.json({
        success: true,
        data: restaurant,
      });
    } else {
      res.status(404).json({ success: false, message: "Restaurant not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { restaurant_name, owner_name, email, phone, description } = req.body;
    console.log("Updating profile for restaurant ID:", req.restaurant.id);
    
    const restaurant = await Restaurant.findById(req.restaurant.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    restaurant.restaurant_name = restaurant_name || restaurant.restaurant_name;
    restaurant.owner_name = owner_name || restaurant.owner_name;
    restaurant.email = email || restaurant.email;
    restaurant.phone = phone || restaurant.phone;
    restaurant.description = description || restaurant.description;

    await restaurant.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: restaurant._id,
        restaurant_name: restaurant.restaurant_name,
        email: restaurant.email,
        slug: restaurant.slug,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerRestaurant,
  loginRestaurant,
  getMe,
  updateProfile,
};
