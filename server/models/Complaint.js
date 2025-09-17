const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false,
      default: undefined,
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  images: [{
    type: String,
    required: false
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  category: {
    type: String,
    enum: ['uncollected-waste', 'overflowing-dustbin', 'illegal-dumping', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  resolutionDetails: {
    startedAt: Date,
    completedAt: Date,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    notes: String,
    beforeImages: [String],
    afterImages: [String]
  },
  pointsAwarded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate with virtuals
ComplaintSchema.virtual('updates', {
  ref: 'ComplaintUpdate',
  localField: '_id',
  foreignField: 'complaint',
  justOne: false
});

// Geocode & create location field
ComplaintSchema.pre('save', async function(next) {
  // TODO: Implement geocoding logic here
  // This would convert the address to coordinates
  next();
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
