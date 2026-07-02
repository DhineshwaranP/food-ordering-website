const MenuItem = require('../models/MenuItem');
const path = require('path');
const fs = require('fs');

const getAllMenuItems = async (req, res) => {
  try {
    const { category, search, available } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (available === 'true') {
      filter.isAvailable = true;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, preparationTime, tags } = req.body;

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || '';

    const item = await MenuItem.create({
      name,
      description,
      price: parseFloat(price),
      category,
      image: imageUrl,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' || isAvailable === true : true,
      preparationTime: parseInt(preparationTime) || 10,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    const { name, description, price, category, isAvailable, preparationTime, tags } = req.body;

    if (req.file) {
      if (item.image && item.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', item.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      item.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      item.image = req.body.image;
    }

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = parseFloat(price);
    if (category !== undefined) item.category = category;
    if (isAvailable !== undefined) item.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (preparationTime !== undefined) item.preparationTime = parseInt(preparationTime);
    if (tags !== undefined) {
      item.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }

    const updated = await item.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    if (item.image && item.image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await item.deleteOne();
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    item.isAvailable = !item.isAvailable;
    await item.save();
    res.status(200).json({ isAvailable: item.isAvailable, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(200).json([]);

    const items = await MenuItem.find(
      { name: { $regex: q, $options: 'i' }, isAvailable: true },
      { name: 1, category: 1, price: 1 }
    ).limit(6);

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getSearchSuggestions,
};
