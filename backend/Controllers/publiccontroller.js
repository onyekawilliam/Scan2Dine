const crypto = require("crypto");
const Restaurant = require("../Models/restaurantmodel");
const Category = require("../Models/categorymodel");
const MenuItem = require("../Models/menumodel");
const Order = require("../Models/ordermodel");
const RestaurantSettings = require("../Models/settingsmodel");
const { isObjectId, fail, serverError, notFound } = require("../utils/http");

// Customers must never receive owner details (email, phone, password hash, plan, ...).
const PUBLIC_RESTAURANT_FIELDS = "restaurant_name description address logo_url slug";

// @route   GET /api/public/menu/:restaurant_slug   (the slug may also be the restaurant id)
const getPublicMenu = async (req, res) => {
  try {
    const key = String(req.params.restaurant_slug);
    let query;
    if (key === "demo" && process.env.MOCK_DB === "true") {
      query = { email: "demo@scan2dine.com" };
    } else if (isObjectId(key)) {
      query = { _id: key };
    } else {
      query = { slug: key };
    }

    const restaurant = await Restaurant.findOne({ ...query, is_active: true }).select(PUBLIC_RESTAURANT_FIELDS);
    if (!restaurant) return notFound(res, "Restaurant");

    const [categories, items] = await Promise.all([
      Category.find({ restaurant_id: restaurant._id, is_active: true }).sort("display_order createdAt"),
      MenuItem.find({ restaurant_id: restaurant._id }).sort("display_order name"),
    ]);

    res.json({ success: true, data: { restaurant, categories, items } });
  } catch (error) {
    serverError(res, error);
  }
};

const makeOrderNumber = () => "ORD-" + crypto.randomBytes(3).toString("hex").toUpperCase();

// @route   POST /api/public/orders
const placeOrder = async (req, res) => {
  try {
    const { restaurant_id, customer_name, customer_phone, customer_email, table_number, special_instructions, items } = req.body;

    const restaurant = await Restaurant.findOne({ _id: restaurant_id, is_active: true }).select("_id");
    if (!restaurant) return notFound(res, "Restaurant");

    // Merge duplicate lines, then load ONLY items that belong to this restaurant.
    // Prices always come from the database, never from the request.
    const wanted = new Map();
    for (const line of items) {
      const existing = wanted.get(line.menu_item_id);
      if (existing) existing.quantity += line.quantity;
      else wanted.set(line.menu_item_id, { ...line });
    }

    const menuItems = await MenuItem.find({ _id: { $in: [...wanted.keys()] }, restaurant_id: restaurant._id });
    const byId = new Map(menuItems.map((m) => [String(m._id), m]));

    const problems = [];
    for (const id of wanted.keys()) {
      const menuItem = byId.get(id);
      if (!menuItem) problems.push("An item in your cart is no longer on this menu");
      else if (!menuItem.is_available) problems.push(`${menuItem.name} is currently unavailable`);
    }
    if (problems.length) {
      return fail(res, 400, "ITEMS_UNAVAILABLE", [...new Set(problems)].join(". "));
    }

    // Money is calculated in whole cents to avoid floating-point drift (0.1 + 0.2 and friends).
    let subtotalCents = 0;
    const orderItems = [...wanted.values()].map((line) => {
      const menuItem = byId.get(line.menu_item_id);
      const priceCents = Math.round(menuItem.price * 100);
      const lineCents = priceCents * line.quantity;
      subtotalCents += lineCents;
      return {
        menu_item_id: menuItem._id,
        item_name: menuItem.name,
        item_price: priceCents / 100,
        quantity: line.quantity,
        special_instructions: line.special_instructions || undefined,
        subtotal: lineCents / 100,
      };
    });

    // Tax comes from the restaurant's own settings (a percentage, 0 when none are configured).
    const settings = await RestaurantSettings.findOne({ restaurant_id: restaurant._id }).lean();
    const taxCents = Math.round((subtotalCents * (settings?.tax_rate || 0)) / 100);

    let order;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      try {
        order = await Order.create({
          restaurant_id: restaurant._id,
          order_number: makeOrderNumber(),
          customer_name: customer_name || undefined,
          customer_phone: customer_phone || undefined,
          customer_email: customer_email || undefined,
          table_number: table_number || undefined,
          special_instructions: special_instructions || undefined,
          items: orderItems,
          subtotal: subtotalCents / 100,
          tax: taxCents / 100,
          total: (subtotalCents + taxCents) / 100,
        });
      } catch (error) {
        if (error.code !== 11000) throw error; // order number collision: try a new one
      }
    }
    if (!order) throw new Error("Could not generate a unique order number");

    // Only authenticated staff sockets of this restaurant are in this room.
    const io = req.app.get("io");
    if (io) io.to(String(restaurant._id)).emit("new_order", order);

    res.status(201).json({ success: true, message: "Order placed successfully", data: { order: toCustomerOrder(order) } });
  } catch (error) {
    serverError(res, error);
  }
};

// What a customer may see about an order: no phone, email or restaurant internals.
const toCustomerOrder = (order, restaurant) => ({
  _id: order._id,
  order_number: order.order_number,
  status: order.status,
  table_number: order.table_number,
  items: order.items.map((i) => ({
    item_name: i.item_name,
    item_price: i.item_price,
    quantity: i.quantity,
    subtotal: i.subtotal,
  })),
  subtotal: order.subtotal,
  tax: order.tax,
  total: order.total,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  ...(restaurant ? { restaurant_name: restaurant.restaurant_name, restaurant_slug: restaurant.slug } : {}),
});

// @route   GET /api/public/orders/:id
const getOrderStatus = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return notFound(res, "Order");
    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res, "Order");

    const restaurant = await Restaurant.findById(order.restaurant_id).select("restaurant_name slug");
    res.json({ success: true, data: toCustomerOrder(order, restaurant) });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = { getPublicMenu, placeOrder, getOrderStatus };
