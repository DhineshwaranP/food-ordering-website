const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

router.get('/analytics', protect, adminOnly, getAnalytics);

module.exports = router;
