const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a user or hospital
    let user = await User.findById(decoded.id);
    if (!user) {
      user = await Hospital.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.userType = 'hospital';
    } else {
      req.userType = 'user';
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;