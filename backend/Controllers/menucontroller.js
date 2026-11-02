const Category = require("../Models/categorymodel");
const MenuItem = require("../Models/menumodel");
const { isObjectId, fail, serverError, notFound } = require("../utils/http");

// Every query below is scoped by req.restaurant.id (taken from the verified token,
// never from the request body or URL), so a restaurant can only touch its own data.

// @route   GET /api/menu/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ restaurant_id: req.restaurant.id }).sort("display_order createdAt");
    res.json({ success: true, data: categories });
  } catch (error) {
    serverError(res, error);
  }
};

// @route   POST /api/menu/categories
const createCategory = async (req, res) => {
  try {
    const { name, display_order, description, emoji_icon } = req.body;
    const last = await Category.findOne({ restaurant_id: req.restaurant.id }).sort("-display_order").select("display_order");
    const category = await Category.create({
      restaurant_id: req.restaurant.id,
      name,
      description,
      emoji_icon: emoji_icon || undefined,
      display_order: display_order ?? (last ? last.display_order + 1 : 0),
    });
    res.status(201).json({ success: true, message: "Category created successfully", data: category });
  } catch (error) {
    serverError(res, error);
  }
};

// @route   PUT /api/menu/categories/:id
const updateCategory = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return notFound(res, "Category");
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, restaurant_id: req.restaurant.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!category) return notFound(res, "Category");
    res.json({ success: true, message: "Category updated successfully", data: category });
  } catch (error) {
    serverError(res, error);
  }
};

// @route   PUT /api/menu/categories/reorder   body: { order: [categoryId, ...] }
const reorderCategories = async (req, res) => {
  try {
    const { order } = req.body;
    await Category.bulkWrite(
      order.map((id, index) => ({
        updateOne: {
          filter: { _id: id, restaurant_id: req.restaurant.id },
          update: { $set: { display_order: index } },
        },
      }))
    );
    const categories = await Category.find({ restaurant_id: req.restaurant.id }).sort("display_order createdAt");
    res.json({ success: true, message: "Categories reordered", data: categories });
  } catch (error) {
    serverError(res, error);
  }
};

// @route   DELETE /api/menu/categories/:id
const deleteCategory = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return notFound(res, "Category");
    const category = await Category.findOne({ _id: req.params.id, restaurant_id: req.restaurant.id });
    if (!category) return notFound(res, "Category");

    const itemCount = await MenuItem.countDocuments({ restaurant_id: req.restaurant.id, category_id: category._id });
    if (itemCount > 0) {
      return fail(
        res,
        409,
        "CATEGORY_NOT_EMPTY",
        `This category still has ${itemCount} menu item${itemCount === 1 ? "" : "s"}. Move or delete them first.`
      );
    }

    await category.deleteOne();
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    serverError(res, error);
  }
};

// @route   GET /api/menu/items
const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurant_id: req.restaurant.id })
      .sort("display_order name")
      .populate("category_id", "name");
    res.json({ success: true, data: { items } });
  } catch (error) {
    serverError(res, error);
  }
};

// A category id from the client is only trusted if it belongs to the same restaurant.
const categoryBelongsToRestaurant = (categoryId, restaurantId) =>
  Category.exists({ _id: categoryId, restaurant_id: restaurantId });

// @route   POST /api/menu/items
const createMenuItem = async (req, res) => {
  try {
    if (!(await categoryBelongsToRestaurant(req.body.category_id, req.restaurant.id))) {
      return fail(res, 400, "INVALID_CATEGORY", "That category does not exist");
    }

    const menuItem = await MenuItem.create({ ...req.body, restaurant_id: req.restaurant.id });
    res.status(201).json({ success: true, message: "Menu item created successfully", data: menuItem });
  } catch (error) {
    serverError(res, error);
  }
};

// @route   PUT /api/menu/items/:id
const updateMenuItem = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return notFound(res, "Menu item");

    if (req.body.category_id && !(await categoryBelongsToRestaurant(req.body.category_id, req.restaurant.id))) {
      return fail(res, 400, "INVALID_CATEGORY", "That category does not exist");
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurant_id: req.restaurant.id },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("category_id", "name");
    if (!menuItem) return notFound(res, "Menu item");

    res.json({ success: true, message: "Menu item updated successfully", data: menuItem });
  } catch (error) {
    serverError(res, error);
  }
};

// @route   DELETE /api/menu/items/:id
const deleteMenuItem = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return notFound(res, "Menu item");
    const menuItem = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant_id: req.restaurant.id });
    if (!menuItem) return notFound(res, "Menu item");
    res.json({ success: true, message: "Menu item deleted" });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  reorderCategories,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
