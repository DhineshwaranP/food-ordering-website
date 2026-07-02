const User = require('../models/User');
const jwt = require('jsonwebtoken');

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  favorites: user.favorites,
  authProvider: user.authProvider,
});

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered. Please sign in instead.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      authProvider: 'local',
    });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google sign in.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ message: 'Google sign in is not configured. Add GOOGLE_CLIENT_ID to backend/.env and VITE_GOOGLE_CLIENT_ID to frontend/.env.' });
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const profile = await response.json();

    if (!response.ok) {
      return res.status(401).json({ message: profile.error_description || 'Invalid Google credential' });
    }
    if (profile.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: 'Google client ID mismatch' });
    }
    if (!profile.email_verified) {
      return res.status(401).json({ message: 'Google email is not verified' });
    }

    let user = await User.findOne({ email: profile.email });
    if (user) {
      user.googleId = profile.sub;
      user.authProvider = user.authProvider || 'google';
      if (!user.name) user.name = profile.name || profile.email.split('@')[0];
      await user.save();
    } else {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        googleId: profile.sub,
        authProvider: 'google',
        role: role === 'admin' ? 'admin' : 'user',
      });
    }

    const token = generateToken(user._id);
    res.status(200).json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Google sign in failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('favorites');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.favorites.indexOf(itemId);
    if (index === -1) {
      user.favorites.push(itemId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();
    const updated = await User.findById(req.user._id).populate('favorites');
    res.status(200).json({ favorites: updated.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, googleLogin, getProfile, toggleFavorite };