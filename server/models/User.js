const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: function () { return this.role === 'worker'; },
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['citizen', 'worker', 'municipal'],
    default: 'citizen'
  },
  // Public-facing identifier for workers
  workerId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    set: v => (typeof v === 'string' ? v.toUpperCase() : v),
    required: function () { return this.role === 'worker'; }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  
  points: {
    type: Number,
    default: 0
  },
  pointsHistory: [
    {
      points: { type: Number, required: true },
      reason: { type: String },
      date: { type: Date, default: Date.now }
    }
  ],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure workerId is uppercase if present
userSchema.pre('save', function (next) {
  if (this.workerId && typeof this.workerId === 'string') {
    this.workerId = this.workerId.toUpperCase();
  }
  next();
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Geocoding middleware to convert address to lat/lng
userSchema.pre('save', async function(next) {
  if (!this.isModified('address')) {
    next();
  }
  
  // TODO: Implement geocoding logic here
  // This would convert the address to coordinates
  
  next();
});

module.exports = mongoose.model('User', userSchema);
