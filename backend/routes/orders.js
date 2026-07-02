const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

router.post('/', protect, placeOrder);
router.get('/my', protect, getUserOrders);
router.get('/all', protect, adminOnly, getAllOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/cancel', protect, cancelOrder);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
