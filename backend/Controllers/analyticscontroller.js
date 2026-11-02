const mongoose = require("mongoose");
const Order = require("../Models/ordermodel");
const MenuItem = require("../Models/menumodel");
const { serverError } = require("../utils/http");

const DAYS = 7;
const dayKey = (date) => date.toISOString().slice(0, 10);

// @route   GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    // Aggregation pipelines do NOT cast strings to ObjectId like find() does,
    // so the id from the token must be converted or nothing would ever match.
    const restaurantId = new mongoose.Types.ObjectId(req.restaurant.id);

    // Last 7 calendar days including today (UTC), oldest first.
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (DAYS - 1));

    const notCancelled = { status: { $ne: "cancelled" } };

    const [[stats], dailyRaw, menuItemsCount] = await Promise.all([
      Order.aggregate([
        { $match: { restaurant_id: restaurantId } },
        {
          $facet: {
            totalStats: [
              { $match: notCancelled },
              { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: "$total" } } },
            ],
            ordersByStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            popularItems: [
              { $match: notCancelled },
              { $unwind: "$items" },
              {
                $group: {
                  _id: "$items.item_name",
                  ordersCount: { $sum: "$items.quantity" },
                  revenue: { $sum: "$items.subtotal" },
                },
              },
              { $sort: { ordersCount: -1 } },
              { $limit: 5 },
            ],
          },
        },
      ]),
      Order.aggregate([
        { $match: { restaurant_id: restaurantId, createdAt: { $gte: since }, ...notCancelled } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      ]),
      MenuItem.countDocuments({ restaurant_id: restaurantId, is_available: true }),
    ]);

    const ordersByStatus = {};
    stats.ordersByStatus.forEach((s) => {
      ordersByStatus[s._id] = s.count;
    });

    // Fill days with no orders so the chart always has 7 points.
    const byDay = new Map(dailyRaw.map((d) => [d._id, d]));
    const daily = Array.from({ length: DAYS }, (_, i) => {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + i);
      const key = dayKey(date);
      const row = byDay.get(key);
      return { date: key, revenue: row ? row.revenue : 0, orders: row ? row.orders : 0 };
    });

    res.json({
      success: true,
      data: {
        total_orders: stats.totalStats[0]?.totalOrders || 0,
        total_revenue: stats.totalStats[0]?.totalRevenue || 0,
        menu_items_count: menuItemsCount,
        popular_items: stats.popularItems,
        orders_by_status: ordersByStatus,
        daily,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = { getDashboardStats };
