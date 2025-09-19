const mongoose = require('mongoose');

const TaskUpdateSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    action: { type: String, enum: ['created', 'assigned', 'in-progress', 'completed', 'cancelled', 'approved', 'images-uploaded', 'note'], required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaskUpdate', TaskUpdateSchema);
