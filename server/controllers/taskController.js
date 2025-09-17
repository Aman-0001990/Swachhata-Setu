const mongoose = require('mongoose');
const Task = require('../models/Task');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a task (municipal)
// @route   POST /api/tasks
// @access  Private (municipal)
exports.createTask = asyncHandler(async (req, res, next) => {
  const payload = {
    title: req.body.title,
    description: req.body.description,
    createdBy: req.user.id,
    assignedTo: req.body.assignedTo,
    status: req.body.assignedTo ? 'assigned' : 'pending',
    priority: req.body.priority || 'medium',
    dueDate: req.body.dueDate,
    location: req.body.location
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
  const tasks = await Task.find(filter).populate('createdBy', 'name role').populate('assignedTo', 'name role');
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
  if (!mongoose.Types.ObjectId.isValid(workerId)) {
    return next(new ErrorResponse('Invalid worker id', 400));
  }
  const task = await Task.findById(req.params.id);
  if (!task) return next(new ErrorResponse('Task not found', 404));
  task.assignedTo = workerId;
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
