const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  contactPerson: {
    name: {
      type: String,
      required: true
    },
    designation: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  services: [{
    type: String,
    enum: ['Emergency', 'Surgery', 'Blood Bank', 'ICU', 'Trauma Center']
  }]
}, {
  timestamps: true
});

// Create geospatial index
hospitalSchema.index({ location: '2dsphere' });

// Hash password before saving
hospitalSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
hospitalSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Hospital', hospitalSchema);