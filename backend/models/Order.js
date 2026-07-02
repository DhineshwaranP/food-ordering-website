const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: () => 'ORD-' + uuidv4().split('-')[0].toUpperCase(),
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Placed', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Placed',
    },
    customerMessage: {
      type: String,
      default: 'Your order has been placed and sent to the kitchen.',
      trim: true,
      maxlength: 300,
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'CARD'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    statusHistory: [
      {
        status: { type: String },
        message: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory = [{ status: 'Placed', message: this.customerMessage, timestamp: new Date() }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);