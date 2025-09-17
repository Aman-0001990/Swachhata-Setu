const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save inside server/uploads/complaints
    const dir = path.join(__dirname, '../uploads/complaints');
    // Ensure the directory exists
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) return cb(err, dir);
      cb(null, dir);
    });
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({ storage });

// Expose multer middleware
exports.uploadComplaintImages = upload.array('images', 5);

// @desc    Create a complaint (citizen)
// @route   POST /api/complaints
// @access  Private (citizen)
exports.createComplaint = asyncHandler(async (req, res, next) => {
  const { title, description, category, priority, location } = req.body;

  const payload = {
    user: req.user.id,
    title,
    description,
    category,
    priority: priority || 'medium',
    location
  };

  // Attach uploaded images if any
  if (req.files && req.files.length > 0) {
    payload.images = req.files.map(f => `/uploads/complaints/${path.basename(f.path)}`);
  }

  const complaint = await Complaint.create(payload);
  res.status(201).json({ success: true, data: complaint });
});

// @desc    Get all complaints (role-based access)
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = asyncHandler(async (req, res, next) => {
  // Municipal can see all, worker sees assigned or nearby (basic: assigned), citizen sees own
  let filter = {};
  if (req.user.role === 'citizen') {
    filter.user = req.user.id;
  } else if (req.user.role === 'worker') {
    filter.$or = [{ assignedTo: req.user.id }];
  }

  const complaints = await Complaint.find(filter).populate('user', 'name role').populate('assignedTo', 'name role');
  res.status(200).json({ success: true, count: complaints.length, data: complaints });
});

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid complaint id', 400));
  }
  const complaint = await Complaint.findById(req.params.id).populate('user', 'name role').populate('assignedTo', 'name role');
  if (!complaint) return next(new ErrorResponse('Complaint not found', 404));

  // Citizen can access own complaint only
  if (req.user.role === 'citizen' && complaint.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  res.status(200).json({ success: true, data: complaint });
});

// @desc    Assign complaint to a worker
// @route   PUT /api/complaints/:id/assign
// @access  Private (municipal)
exports.assignComplaint = asyncHandler(async (req, res, next) => {
  const { workerId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid complaint id', 400));
  }
  if (!mongoose.Types.ObjectId.isValid(workerId)) {
    return next(new ErrorResponse('Invalid worker id', 400));
  }
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return next(new ErrorResponse('Complaint not found', 404));

  const worker = await User.findById(workerId);
  if (!worker || worker.role !== 'worker') {
    return next(new ErrorResponse('Invalid worker', 400));
  }

  complaint.assignedTo = workerId;
  complaint.status = 'in-progress';
  await complaint.save();

  res.status(200).json({ success: true, data: complaint });
});

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (worker, municipal)
exports.updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;
  const allowed = ['pending', 'in-progress', 'resolved', 'rejected'];
  if (!allowed.includes(status)) return next(new ErrorResponse('Invalid status', 400));

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid complaint id', 400));
  }
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return next(new ErrorResponse('Complaint not found', 404));

  // Worker can update only assigned complaints
  if (req.user.role === 'worker' && complaint.assignedTo?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  complaint.status = status;
  if (status === 'resolved') {
    complaint.resolutionDetails = complaint.resolutionDetails || {};
    complaint.resolutionDetails.resolvedAt = new Date();
    complaint.resolutionDetails.resolvedBy = req.user.id;
    if (notes) complaint.resolutionDetails.notes = notes;
  }

  await complaint.save();
  res.status(200).json({ success: true, data: complaint });
});

// @desc    Upload images for a complaint (before/after)
// @route   POST /api/complaints/:id/images
// @access  Private (worker)
exports.uploadResolutionImages = [
  upload.array('images', 5),
  asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorResponse('Invalid complaint id', 400));
    }
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return next(new ErrorResponse('Complaint not found', 404));

    if (req.user.role === 'worker' && complaint.assignedTo?.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const field = req.query.type === 'after' ? 'afterImages' : 'beforeImages';
    complaint.resolutionDetails = complaint.resolutionDetails || {};
    complaint.resolutionDetails[field] = complaint.resolutionDetails[field] || [];
    const added = (req.files || []).map(f => `/uploads/complaints/${path.basename(f.path)}`);
    complaint.resolutionDetails[field].push(...added);

    await complaint.save();
    res.status(200).json({ success: true, data: complaint });
  })
];
