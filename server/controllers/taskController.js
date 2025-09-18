const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a task (municipal)
// @route   POST /api/tasks
// @access  Private (municipal)
exports.createTask = asyncHandler(async (req, res, next) => {
  const { title, description, priority, dueDate, location } = req.body || {};
  let { assignedTo } = req.body || {};

  if (!title || typeof title !== 'string') {
    return next(new ErrorResponse('title is required', 400));
  }

  // Resolve assignedTo: accept either Mongo ObjectId or public workerId string
  let assignedToId = undefined;
  if (assignedTo) {
    if (typeof assignedTo === 'string' && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      const manualId = assignedTo.trim().toUpperCase();
      const worker = await User.findOne({ workerId: manualId, role: 'worker' });
      if (!worker) return next(new ErrorResponse('Worker ID does not exist', 404));
      assignedToId = worker._id;
    } else {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return next(new ErrorResponse('Invalid assignedTo', 400));
      }
      assignedToId = assignedTo;
    }
  }

  const payload = {
    title,
    description,
    createdBy: req.user.id,
    assignedTo: assignedToId,
    status: assignedToId ? 'assigned' : 'pending',
    priority: priority || 'medium',
    dueDate,
    location,
    relatedComplaint: req.body.relatedComplaint
  };

  const task = await Task.create(payload);
  res.status(201).json({ success: true, data: task });
});

// @desc    Get tasks (role-based)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.user.role === 'worker') {
    filter.assignedTo = req.user.id;
  } else if (req.user.role === 'citizen') {
    filter.createdBy = req.user.id; // if we allow citizens to create hire tasks later
  }
  const tasks = await Task.find(filter)
    .populate('createdBy', 'name role')
    .populate('assignedTo', 'name role workerId');
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid task id', 400));
  }
  const task = await Task.findById(req.params.id).populate('createdBy', 'name role').populate('assignedTo', 'name role');
  if (!task) return next(new ErrorResponse('Task not found', 404));
  res.status(200).json({ success: true, data: task });
});

// @desc    Assign/ Reassign task to a worker (municipal)
// @route   PUT /api/tasks/:id/assign
// @access  Private (municipal)
exports.assignTask = asyncHandler(async (req, res, next) => {
  const { workerId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid task id', 400));
  }
  // Accept either Mongo ObjectId OR public workerId like 'WRK-0001'
  let workerObjectId = null;
  if (typeof workerId === 'string' && !mongoose.Types.ObjectId.isValid(workerId)) {
    const manualId = workerId.trim().toUpperCase();
    const worker = await User.findOne({ workerId: manualId, role: 'worker' });
    if (!worker) return next(new ErrorResponse('Worker ID does not exist', 404));
    workerObjectId = worker._id;
  } else {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return next(new ErrorResponse('Invalid worker id', 400));
    }
    workerObjectId = workerId;
  }

  const task = await Task.findById(req.params.id);
  if (!task) return next(new ErrorResponse('Task not found', 404));
  task.assignedTo = workerObjectId;
  task.status = 'assigned';
  await task.save();
  res.status(200).json({ success: true, data: task });
});

// @desc    Update task status (worker)
// @route   PUT /api/tasks/:id/status
// @access  Private (worker, municipal)
exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const allowed = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return next(new ErrorResponse('Invalid status', 400));

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid task id', 400));
  }
  const task = await Task.findById(req.params.id);
  if (!task) return next(new ErrorResponse('Task not found', 404));

  if (req.user.role === 'worker' && task.assignedTo?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  task.status = status;
  if (status === 'completed') {
    task.completedAt = new Date();
  } else if (task.completedAt) {
    // if moving away from completed, clear stamp
    task.completedAt = undefined;
  }
  await task.save();
  res.status(200).json({ success: true, data: task });
});

// @desc    Delete task (municipal)
// @route   DELETE /api/tasks/:id
// @access  Private (municipal)
exports.deleteTask = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid task id', 400));
  }
  await Task.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, data: {} });
});
