const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

const getAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMenuItems = await MenuItem.countDocuments();

    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const popularItems = await MenuItem.find()
      .sort({ totalOrders: -1 })
      .limit(5)
      .select('name category price totalOrders image');

    const revenueByDay = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 7 },
    ]);

    const categoryRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuDetails',
        },
      },
      { $unwind: '$menuDetails' },
      {
        $group: {
          _id: '$menuDetails.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          count: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.status(200).json({
      totalOrders,
      totalUsers,
      totalMenuItems,
      totalRevenue,
      ordersByStatus,
      popularItems,
      revenueByDay: revenueByDay.reverse(),
      categoryRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
