const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedComplaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    status: { type: String, enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date },
    completedAt: { type: Date },
    resolutionDetails: {
      startedAt: { type: Date },
      completedAt: { type: Date },
      beforeImages: [{ type: String }],
      afterImages: [{ type: String }]
    },
    // Approval & archival
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    archived: { type: Boolean, default: false },
    rewardPoints: { type: Number, default: 0 },
    penaltyPoints: { type: Number, default: 0 },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: false,
        index: '2dsphere'
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);
