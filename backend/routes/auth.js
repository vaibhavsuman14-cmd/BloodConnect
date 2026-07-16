const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// User Registration
router.post('/register/user', async (req, res) => {
  try {
    const {
      name, email, password, phone, bloodType, 
      coordinates, address, maxDistance, emergencyContact
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      bloodType,
      location: {
        type: 'Point',
        coordinates: coordinates // [longitude, latitude]
      },
      address,
      maxDistance: maxDistance || 10,
      emergencyContact: emergencyContact || false
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        type: 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hospital Registration
router.post('/register/hospital', async (req, res) => {
  try {
    const {
      name, email, password, phone, registrationNumber,
      coordinates, address, city, state, pincode,
      contactPerson, services
    } = req.body;

    // Check if hospital exists
    const existingHospital = await Hospital.findOne({ 
      $or: [{ email }, { registrationNumber }] 
    });
    if (existingHospital) {
      return res.status(400).json({ message: 'Hospital already exists' });
    }

    // Create new hospital
    const hospital = new Hospital({
      name,
      email,
      password,
      phone,
      registrationNumber,
      location: {
        type: 'Point',
        coordinates: coordinates // [longitude, latitude]
      },
      address,
      city,
      state,
      pincode,
      contactPerson,
      services: services || []
    });

    await hospital.save();

    const token = generateToken(hospital._id);

    res.status(201).json({
      token,
      user: {
        id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        registrationNumber: hospital.registrationNumber,
        type: 'hospital'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Login
router.post('/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        type: 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hospital Login
router.post('/login/hospital', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find hospital
    const hospital = await Hospital.findOne({ email });
    if (!hospital || !(await hospital.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(hospital._id);

    res.json({
      token,
      user: {
        id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        registrationNumber: hospital.registrationNumber,
        type: 'hospital'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        type: req.userType,
        ...(req.userType === 'user' ? { bloodType: req.user.bloodType } : { registrationNumber: req.user.registrationNumber })
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;