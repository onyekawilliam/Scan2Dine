const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Restaurant = require("../Models/restaurantmodel");
const { signToken } = require("../Middleware/authMiddleware");
const { fail, serverError, notFound } = require("../utils/http");

const publicUser = (restaurant) => ({
  id: restaurant._id,
  restaurant_name: restaurant.restaurant_name,
  email: restaurant.email,
  slug: restaurant.slug,
});

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "restaurant";

// A random suffix keeps slugs unpredictable; we retry on the (unlikely) collision.
const uniqueSlug = async (name) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${slugify(name)}-${crypto.randomBytes(2).toString("hex")}`;
    if (!(await Restaurant.exists({ slug }))) return slug;
  }
  return `${slugify(name)}-${crypto.randomBytes(6).toString("hex")}`;
};

const registerRestaurant = async (req, res) => {
  try {
    const { restaurant_name, owner_name, email, password, phone } = req.body;

    if (await Restaurant.exists({ email })) {
      return fail(res, 409, "CONFLICT", "An account with this email already exists");
    }

    const password_hash = await bcrypt.hash(password, 12);
    const restaurant = await Restaurant.create({
      restaurant_name,
      owner_name,
      email,
      password_hash,
      phone,
      slug: await uniqueSlug(restaurant_name),
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { user: publicUser(restaurant), token: signToken(restaurant._id) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 409, "CONFLICT", "An account with this email already exists");
    }
    serverError(res, error);
  }
};

const loginRestaurant = async (req, res) => {
  try {
    const { email, password } = req.body;
    const restaurant = await Restaurant.findOne({ email });

    // Same response for "no such account" and "wrong password" so emails can't be enumerated.
    if (!restaurant || !restaurant.is_active || !(await bcrypt.compare(password, restaurant.password_hash))) {
      return fail(res, 401, "UNAUTHORIZED", "Invalid email or password");
    }

    res.json({
      success: true,
      message: "Login successful",
      data: { user: publicUser(restaurant), token: signToken(restaurant._id) },
    });
  } catch (error) {
    serverError(res, error);
  }
};

const getMe = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.id).select("-password_hash");
    if (!restaurant) return notFound(res, "Restaurant");
    res.json({ success: true, data: restaurant });
  } catch (error) {
    serverError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.id);
    if (!restaurant) return notFound(res, "Restaurant");

    const { email } = req.body;
    if (email && email !== restaurant.email && (await Restaurant.exists({ email, _id: { $ne: restaurant._id } }))) {
      return fail(res, 409, "CONFLICT", "That email is already used by another account");
    }

    // Only whitelisted fields reach this point (validate middleware strips the rest).
    // `in` (not `||`) so a field can be deliberately cleared to an empty string.
    for (const field of ["restaurant_name", "owner_name", "email", "phone", "address", "description"]) {
      if (field in req.body) restaurant[field] = req.body[field];
    }
    await restaurant.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: publicUser(restaurant),
    });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = { registerRestaurant, loginRestaurant, getMe, updateProfile };
