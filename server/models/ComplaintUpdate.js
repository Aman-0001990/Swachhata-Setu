const mongoose = require('mongoose');

const ComplaintUpdateSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    action: { type: String, enum: ['created', 'assigned', 'in-progress', 'resolved', 'rejected', 'note', 'task-created'], required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComplaintUpdate', ComplaintUpdateSchema);
