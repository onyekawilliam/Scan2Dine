const Restaurant = require("../Models/restaurantmodel");
const Category = require("../Models/categorymodel");
const MenuItem = require("../Models/menumodel");
const Order = require("../Models/ordermodel");

// @route   GET /api/public/menu/:restaurant_slug
const getPublicMenu = async (req, res) => {
  try {
    // Also support finding by ID if the parameter isn't a slug
    let restaurant;
    if (req.params.restaurant_slug === 'demo') {
      restaurant = await Restaurant.findOne({ email: "demo@scan2dine.com" });
    } else if (req.params.restaurant_slug.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(req.params.restaurant_slug).select("-password_hash -email -phone");
    } else {
      restaurant = await Restaurant.findOne({ slug: req.params.restaurant_slug }).select("-password_hash -email -phone");
    }
    
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const categories = await Category.find({ restaurant_id: restaurant._id }).sort('display_order');
    const items = await MenuItem.find({ restaurant_id: restaurant._id });

    res.json({
      success: true,
      data: {
        restaurant,
        categories,
        items
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/public/orders
const placeOrder = async (req, res) => {
  try {
    const { restaurant_id, customer_name, table_number, items } = req.body;
    
    // items should be array of { menu_item_id, quantity, special_instructions }
    
    // 1. Calculate totals securely using database prices
    let subtotal = 0;
    const orderItems = [];
    
    for (const itemReq of items) {
       const menuItem = await MenuItem.findById(itemReq.menu_item_id);
       if (menuItem) {
          const itemSubtotal = menuItem.price * itemReq.quantity;
          subtotal += itemSubtotal;
          
          orderItems.push({
            menu_item_id: menuItem._id,
            item_name: menuItem.name,
            item_price: menuItem.price,
            quantity: itemReq.quantity,
            special_instructions: itemReq.special_instructions,
            subtotal: itemSubtotal
          });
       }
    }
    
    const tax = subtotal * 0.08; // Mock 8% tax
    const total = subtotal + tax;
    
    // 2. Generate Order Number
    const order_number = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

    // 3. Create Order
    const order = await Order.create({
       restaurant_id,
       order_number,
       customer_name,
       table_number,
       items: orderItems,
       subtotal,
       tax,
       total
    });

    // Emit real-time WebSocket event to the restaurant dashboard
    const io = req.app.get("io");
    if (io) {
      io.to(restaurant_id.toString()).emit("new_order", order);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order,
        estimated_time: 25
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/public/orders/:id
const getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublicMenu,
  placeOrder,
  getOrderStatus,
};
