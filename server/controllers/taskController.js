const mongoose = require('mongoose');
const Task = require('../models/Task');
const TaskUpdate = require('../models/TaskUpdate');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

// Cloudinary-backed multer storage for task images
const taskImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wms/tasks',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});
const uploadTask = multer({ storage: taskImageStorage });

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
  // history: created
  try {
    await TaskUpdate.create({ task: task._id, action: 'created', by: req.user.id, meta: { assignedTo: task.assignedTo } });
  } catch (_) {}
  res.status(201).json({ success: true, data: task });
});

// @desc    Get tasks (role-based)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  const filter = {};
  // by default, exclude archived tasks from tracker lists
  const archived = String(req.query.archived || 'false').toLowerCase() === 'true';
  filter.archived = archived;
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

// @desc    Upload images for a task (before/after)
// @route   POST /api/tasks/:id/images?type=before|after
// @access  Private (worker assigned to the task)
exports.uploadTaskImages = [
  uploadTask.array('images', 5),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const type = req.query.type === 'after' ? 'afterImages' : 'beforeImages';
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorResponse('Invalid task id', 400));
    }
    const task = await Task.findById(id);
    if (!task) return next(new ErrorResponse('Task not found', 404));

    // Only assigned worker or municipal can upload
    if (
      req.user.role === 'worker' && task.assignedTo?.toString() !== req.user.id
    ) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    task.resolutionDetails = task.resolutionDetails || {};
    task.resolutionDetails[type] = task.resolutionDetails[type] || [];
    const uploadedUrls = (req.files || []).map((f) => f.path);
    task.resolutionDetails[type].push(...uploadedUrls);

    // set started/completed timestamps heuristically
    if (!task.resolutionDetails.startedAt) task.resolutionDetails.startedAt = new Date();
    if (type === 'afterImages') task.resolutionDetails.completedAt = new Date();

    await task.save();
    // history: images uploaded
    try {
      await TaskUpdate.create({ task: task._id, action: 'images-uploaded', by: req.user.id, meta: { type, count: uploadedUrls.length } });
    } catch (_) {}
    res.status(200).json({ success: true, data: task });
  })
];

// @desc    Approve a completed task and archive it (municipal head)
// @route   PUT /api/tasks/:id/approve
// @access  Private (municipal)
exports.approveTask = asyncHandler(async (req, res, next) => {
  const { notes } = req.body || {};
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid task id', 400));
  }
  const task = await Task.findById(id);
  if (!task) return next(new ErrorResponse('Task not found', 404));
  // mark approved + archive, ensure status completed and timestamp set
  task.approved = true;
  task.approvedAt = new Date();
  task.approvedBy = req.user.id;
  task.archived = true;
  if (task.status !== 'completed') task.status = 'completed';
  if (!task.completedAt) task.completedAt = new Date();
  await task.save();

  try {
    await TaskUpdate.create({ task: task._id, action: 'approved', by: req.user.id, notes });
  } catch (_) {}

  res.status(200).json({ success: true, data: task });
});

// @desc    Get task updates (history)
// @route   GET /api/tasks/:id/updates
// @access  Private (municipal or assigned worker)
exports.getTaskUpdates = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid task id', 400));
  }
  const task = await Task.findById(id);
  if (!task) return next(new ErrorResponse('Task not found', 404));
  if (
    req.user.role !== 'municipal' &&
    !(req.user.role === 'worker' && task.assignedTo?.toString() === req.user.id)
  ) {
    return next(new ErrorResponse('Not authorized', 403));
  }
  const updates = await TaskUpdate.find({ task: id })
    .sort({ createdAt: -1 })
    .populate('by', 'name role workerId')
    .lean();
  res.status(200).json({ success: true, count: updates.length, data: updates });
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
  // history: assigned
  try {
    await TaskUpdate.create({ task: task._id, action: 'assigned', by: req.user.id, meta: { assignedTo: workerObjectId } });
  } catch (_) {}
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
    task.resolutionDetails = task.resolutionDetails || {};
    task.resolutionDetails.completedAt = task.resolutionDetails.completedAt || new Date();
  } else if (task.completedAt) {
    // if moving away from completed, clear stamp
    task.completedAt = undefined;
  }
  if (status === 'in-progress') {
    task.resolutionDetails = task.resolutionDetails || {};
    if (!task.resolutionDetails.startedAt) task.resolutionDetails.startedAt = new Date();
  }
  await task.save();
  // history: status change
  try {
    await TaskUpdate.create({ task: task._id, action: status, by: req.user.id });
  } catch (_) {}
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
