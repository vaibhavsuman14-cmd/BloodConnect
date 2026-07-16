const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.userType !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    if (req.userType !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    delete updates.password; // Don't allow password updates here
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle emergency contact status
router.patch('/emergency-toggle', auth, async (req, res) => {
  try {
    if (req.userType !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { emergencyContact: !req.user.emergencyContact } },
      { new: true }
    ).select('-password');
    
    res.json({ 
      message: `Emergency contact ${user.emergencyContact ? 'enabled' : 'disabled'}`,
      emergencyContact: user.emergencyContact 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle availability status
router.patch('/availability-toggle', auth, async (req, res) => {
  try {
    if (req.userType !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { isAvailable: !req.user.isAvailable } },
      { new: true }
    ).select('-password');
    
    res.json({ 
      message: `Availability ${user.isAvailable ? 'enabled' : 'disabled'}`,
      isAvailable: user.isAvailable 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update max distance
router.patch('/max-distance', auth, async (req, res) => {
  try {
    if (req.userType !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { maxDistance } = req.body;
    
    if (maxDistance < 1 || maxDistance > 50) {
      return res.status(400).json({ message: 'Max distance must be between 1 and 50 km' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { maxDistance } },
      { new: true }
    ).select('-password');
    
    res.json({ 
      message: `Max distance updated to ${maxDistance} km`,
      maxDistance: user.maxDistance 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;