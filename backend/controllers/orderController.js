const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const statusMessages = {
  Placed: 'Your order has been placed and sent to the kitchen.',
  Preparing: 'Your food is being prepared now.',
  Ready: 'Your order is ready for pickup.',
  Completed: 'Your order has been completed. Thank you!',
  Cancelled: 'Your order has been cancelled.',
};

const placeOrder = async (req, res) => {
  try {
    const { items, specialInstructions, paymentMethod, paymentStatus } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of items) {
      const qty = Number(cartItem.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: 'Each order item must have a valid quantity' });
      }

      const menuItem = await MenuItem.findById(cartItem.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${cartItem.menuItem}` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `${menuItem.name} is currently unavailable` });
      }
      const subtotal = menuItem.price * qty;
      totalAmount += subtotal;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
        image: menuItem.image,
      });
      await MenuItem.findByIdAndUpdate(menuItem._id, { $inc: { totalOrders: qty } });
    }

    const method = ['COD', 'UPI', 'CARD'].includes(paymentMethod) ? paymentMethod : 'COD';
    const status = ['Pending', 'Paid', 'Failed'].includes(paymentStatus) ? paymentStatus : method === 'COD' ? 'Pending' : 'Paid';

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      specialInstructions: specialInstructions || '',
      paymentMethod: method,
      paymentStatus: status,
      customerMessage: statusMessages.Placed,
    });

    await order.populate('user', 'name email');
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }],
    }).populate('user', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }],
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'Placed') {
      return res.status(400).json({ message: 'Only orders with status "Placed" can be cancelled' });
    }

    order.status = 'Cancelled';
    order.customerMessage = statusMessages.Cancelled;
    order.statusHistory.push({ status: 'Cancelled', message: order.customerMessage, timestamp: new Date() });
    await order.save();

    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    res.status(200).json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const validStatuses = ['Placed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const customerMessage = (message && message.trim()) || statusMessages[status] || `Order status updated to ${status}.`;
    order.status = status;
    order.customerMessage = customerMessage;
    order.statusHistory.push({ status, message: customerMessage, timestamp: new Date() });
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };