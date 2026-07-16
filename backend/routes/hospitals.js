const express = require('express');
const Hospital = require('../models/Hospital');
const auth = require('../middleware/auth');

const router = express.Router();

// Get hospital profile
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.userType !== 'hospital') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const hospital = await Hospital.findById(req.user._id).select('-password');
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update hospital profile
router.put('/profile', auth, async (req, res) => {
  try {
    if (req.userType !== 'hospital') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    delete updates.password; // Don't allow password updates here
    delete updates.registrationNumber; // Don't allow reg number updates
    
    const hospital = await Hospital.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all hospitals (public endpoint)
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 10, city, services } = req.query;
    
    let query = { isVerified: true };
    
    if (city) {
      query.city = new RegExp(city, 'i');
    }
    
    if (services) {
      query.services = { $in: services.split(',') };
    }
    
    const hospitals = await Hospital.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
    
    const total = await Hospital.countDocuments(query);
    
    res.json({
      hospitals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;