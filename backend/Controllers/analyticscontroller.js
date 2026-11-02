const Order = require("../Models/ordermodel");

// @route   GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const restaurantId = req.restaurant.id;
    
    // Aggregation pipeline to get orders by status, total revenue, and popular items
    const [stats] = await Order.aggregate([
      { $match: { restaurant_id: restaurantId } },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: "$total" }
              }
            }
          ],
          ordersByStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ],
          popularItems: [
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.item_name",
                ordersCount: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.subtotal" }
              }
            },
            { $sort: { ordersCount: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    const totalOrders = stats.totalStats[0]?.totalOrders || 0;
    const totalRevenue = stats.totalStats[0]?.totalRevenue || 0;
    
    // Format ordersByStatus array into an object mapping
    const ordersByStatus = {};
    stats.ordersByStatus.forEach(stat => {
      ordersByStatus[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        menu_items_count: 0, // In real app, run a countDocuments on MenuItem model
        qr_scans: 0, // Run against qr_scans collection
        popular_items: stats.popularItems,
        orders_by_status: ordersByStatus
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats
};
