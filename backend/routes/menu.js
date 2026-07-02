const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getSearchSuggestions,
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

router.get('/', getAllMenuItems);
router.get('/suggestions', getSearchSuggestions);
router.get('/:id', getMenuItemById);
router.post('/', protect, adminOnly, upload.single('image'), createMenuItem);
router.put('/:id', protect, adminOnly, upload.single('image'), updateMenuItem);
router.delete('/:id', protect, adminOnly, deleteMenuItem);
router.patch('/:id/toggle', protect, adminOnly, toggleAvailability);

module.exports = router;
