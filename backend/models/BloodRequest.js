const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientAge: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  patientGender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsNeeded: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  urgency: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  neededBy: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Partially Fulfilled', 'Fulfilled', 'Expired'],
    default: 'Active'
  },
  matchedDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Notified', 'Confirmed', 'Donated', 'Declined'],
      default: 'Notified'
    },
    notifiedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date,
    donatedAt: Date
  }],
  isEmergency: {
    type: Boolean,
    default: false
  },
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
bloodRequestSchema.index({ bloodType: 1, status: 1, urgency: 1 });
bloodRequestSchema.index({ hospital: 1, status: 1 });
bloodRequestSchema.index({ createdAt: -1 });

// Virtual for time remaining
bloodRequestSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.neededBy - now;
  return Math.max(0, remaining);
});

// Method to check if request is urgent
bloodRequestSchema.methods.isUrgent = function() {
  const timeRemaining = this.timeRemaining;
  const hoursRemaining = timeRemaining / (1000 * 60 * 60);
  return this.urgency === 'Critical' || hoursRemaining <= 6;
};

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);