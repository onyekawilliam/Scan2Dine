const Category = require("../Models/categorymodel");
const MenuItem = require("../Models/menumodel");

// @route   GET /api/menu/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ restaurant_id: req.restaurant.id }).sort('display_order');
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/menu/categories
const createCategory = async (req, res) => {
  try {
    const { name, display_order, description, emoji_icon } = req.body;
    const category = await Category.create({
      restaurant_id: req.restaurant.id,
      name,
      description,
      emoji_icon,
      display_order: display_order || 0,
    });
    
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/menu/items
const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurant_id: req.restaurant.id }).populate('category_id', 'name');
    res.json({
      success: true,
      data: {
        items,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/menu/items
const createMenuItem = async (req, res) => {
  try {
    const { category_id, name, description, price, emoji_icon, allergens, dietary_tags } = req.body;
    
    const menuItem = await MenuItem.create({
      restaurant_id: req.restaurant.id,
      category_id,
      name,
      description,
      price,
      emoji_icon,
      allergens: allergens || [],
      dietary_tags: dietary_tags || [],
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  getMenuItems,
  createMenuItem,
};
