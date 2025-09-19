const multer = require('multer');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Task = require('../models/Task');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

// Configure Cloudinary-backed multer storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wms/complaints',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

// @desc    Municipal: Mark complaint resolved and optionally reward worker
// @route   PUT /api/complaints/:id/resolve
// @access  Private (municipal)
exports.resolveAndReward = asyncHandler(async (req, res, next) => {
  const { points = 0, notes } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid complaint id', 400));
  }
  const complaint = await Complaint.findById(req.params.id).populate('assignedTo');
  if (!complaint) return next(new ErrorResponse('Complaint not found', 404));

  // Only municipal users
  if (req.user.role !== 'municipal') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  complaint.status = 'resolved';
  complaint.resolutionDetails = complaint.resolutionDetails || {};
  // backfill completion timestamps if missing
  if (!complaint.resolutionDetails.startedAt) complaint.resolutionDetails.startedAt = new Date();
  if (!complaint.resolutionDetails.completedAt) complaint.resolutionDetails.completedAt = new Date();
  complaint.resolutionDetails.resolvedAt = new Date();
  complaint.resolutionDetails.resolvedBy = req.user.id;
  if (notes) complaint.resolutionDetails.notes = notes;

  // Reward worker if assigned and points provided
  if (!complaint.pointsAwarded && complaint.assignedTo && Number(points) > 0) {
    const worker = await User.findById(complaint.assignedTo._id);
    if (worker) {
      worker.points += parseInt(points);
      worker.pointsHistory = worker.pointsHistory || [];
      worker.pointsHistory.push({ points: parseInt(points), reason: `Reward for resolving complaint ${complaint._id}`, date: new Date() });
      await worker.save();
      complaint.pointsAwarded = true;
      // Persist reward on complaint for dashboard summaries
      complaint.rewardPoints = parseInt(points);
    }
  }

  await complaint.save();

  // History: resolved
  try {
    await ComplaintUpdate.create({
      complaint: complaint._id,
      action: 'resolved',
      by: req.user.id,
      notes,
      meta: {
        points: Number(points) || 0,
        worker: complaint.assignedTo ? String(complaint.assignedTo._id) : null,
        workerId: complaint.assignedTo ? complaint.assignedTo.workerId : null,
        workerName: complaint.assignedTo ? complaint.assignedTo.name : null,
        startedAt: complaint.resolutionDetails?.startedAt,
        completedAt: complaint.resolutionDetails?.completedAt,
        resolvedAt: complaint.resolutionDetails?.resolvedAt
      }
    });
  } catch (_) {}
  res.status(200).json({ success: true, data: complaint });
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
    // multer-storage-cloudinary sets f.path to the Cloudinary secure URL
    payload.images = req.files.map(f => f.path);
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

  const complaints = await Complaint.find(filter)
    .populate('user', 'name role')
    .populate('assignedTo', 'name role workerId');
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
  let { workerId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid complaint id', 400));
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return next(new ErrorResponse('Complaint not found', 404));

  // Support both public workerId (e.g., "WRK-XXXXXX") and MongoDB ObjectId
  let worker = null;
  if (typeof workerId === 'string' && !mongoose.Types.ObjectId.isValid(workerId)) {
    // Treat as manual Worker ID
    const manualId = workerId.trim().toUpperCase();
    worker = await User.findOne({ workerId: manualId, role: 'worker' });
    if (!worker) return next(new ErrorResponse('Worker ID does not exist', 404));
  } else {
    // Treat as ObjectId
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return next(new ErrorResponse('Invalid worker id', 400));
    }
    worker = await User.findById(workerId);
  }

  if (!worker || worker.role !== 'worker') {
    return next(new ErrorResponse('Invalid worker', 400));
  }

  complaint.assignedTo = worker._id;
  complaint.status = 'in-progress';
  await complaint.save();

  res.status(200).json({ success: true, data: complaint });
});

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (worker, municipal)
exports.updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid complaint id', 400));
  }
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return next(new ErrorResponse('Complaint not found', 404));

  // Only worker assigned or municipal can update
  if (req.user.role === 'worker' && (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user.id)) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  complaint.status = status;

  // Track times for worker progress
  complaint.resolutionDetails = complaint.resolutionDetails || {};
  if (req.user.role === 'worker') {
    if (status === 'in-progress' && !complaint.resolutionDetails.startedAt) {
      complaint.resolutionDetails.startedAt = new Date();
    }
    if (status === 'resolved') {
      complaint.resolutionDetails.completedAt = new Date();
    }
  }

  await complaint.save();

  res.status(200).json({ success: true, data: complaint });
});

// @desc    Municipal: Reject complaint with notes
// @route   PUT /api/complaints/:id/reject
// @access  Private (municipal)
exports.rejectComplaint = asyncHandler(async (req, res, next) => {
  const { notes, workerId, createTask } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid complaint id', 400));
  }
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return next(new ErrorResponse('Complaint not found', 404));
  if (req.user.role !== 'municipal') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  complaint.status = 'rejected';
  complaint.resolutionDetails = complaint.resolutionDetails || {};
  if (notes) complaint.resolutionDetails.notes = notes;
  complaint.resolutionDetails.resolvedBy = req.user.id;
  complaint.resolutionDetails.resolvedAt = new Date();
  await complaint.save();

  // History: rejected
  try {
    await ComplaintUpdate.create({
      complaint: complaint._id,
      action: 'rejected',
      by: req.user.id,
      notes
    });
  } catch (_) {}

  // Apply penalty points if provided
  const raw = req.body || {};
  const penaltyCandidates = [
    raw.penaltyPoints,
    raw.points,
    raw.penalty?.points,
    raw.penalty
  ];
  let penaltyPts = penaltyCandidates.find((v) => Number.isFinite(Number(v)) && Number(v) > 0);
  penaltyPts = Number(penaltyPts || 0);

  if (penaltyPts > 0) {
    // Determine worker to penalize: explicit workerId in body, else complaint.assignedTo
    let targetWorker = null;
    if (workerId) {
      if (typeof workerId === 'string' && !mongoose.Types.ObjectId.isValid(workerId)) {
        const manual = workerId.trim().toUpperCase();
        targetWorker = await User.findOne({ workerId: manual, role: 'worker' });
        if (!targetWorker) return next(new ErrorResponse('Worker ID does not exist', 404));
      } else {
        if (!mongoose.Types.ObjectId.isValid(workerId)) {
          return next(new ErrorResponse('Invalid worker id', 400));
        }
        targetWorker = await User.findById(workerId);
      }
    } else if (complaint.assignedTo) {
      targetWorker = await User.findById(complaint.assignedTo);
    }

    if (targetWorker) {
      targetWorker.points = (targetWorker.points || 0) - penaltyPts;
      targetWorker.pointsHistory = targetWorker.pointsHistory || [];
      targetWorker.pointsHistory.push({ points: -penaltyPts, reason: `Penalty for complaint ${complaint._id} rejection`, date: new Date() });
      await targetWorker.save();

      // Persist penalty on complaint for dashboard summaries
      complaint.penaltyPoints = penaltyPts;
      await complaint.save();

      try {
        await ComplaintUpdate.create({
          complaint: complaint._id,
          action: 'note',
          by: req.user.id,
          notes: `Penalty applied: -${penaltyPts} to worker ${targetWorker.workerId || targetWorker._id}`,
          meta: { penalty: penaltyPts, worker: String(targetWorker._id) }
        });
      } catch (_) {}
    }
  }

  // Optional: create follow-up task if requested and worker provided
  let followUpTask = null;
  if (createTask && workerId) {
    let worker = null;
    if (typeof workerId === 'string' && !mongoose.Types.ObjectId.isValid(workerId)) {
      const manual = workerId.trim().toUpperCase();
      worker = await User.findOne({ workerId: manual, role: 'worker' });
      if (!worker) return next(new ErrorResponse('Worker ID does not exist', 404));
    } else {
      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        return next(new ErrorResponse('Invalid worker id', 400));
      }
      worker = await User.findById(workerId);
    }

    followUpTask = await Task.create({
      title: `Follow-up: ${complaint.title}`,
      description: notes || `Handle rejected complaint ${complaint._id}`,
      createdBy: req.user.id,
      assignedTo: worker?._id,
      status: worker ? 'assigned' : 'pending',
      priority: complaint.priority || 'medium',
      relatedComplaint: complaint._id,
      location: complaint.location
    });

    try {
      await ComplaintUpdate.create({
        complaint: complaint._id,
        action: 'task-created',
        by: req.user.id,
        notes: `Task ${followUpTask._id} created`,
        meta: { taskId: String(followUpTask._id) }
      });
    } catch (_) {}
  }

  res.status(200).json({ success: true, data: complaint, followUpTask });
});

// @desc    List complaint updates (history)
// @route   GET /api/complaints/:id/updates
// @access  Private (municipal or worker assigned or complaint owner)
exports.getComplaintUpdates = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('Invalid complaint id', 400));
  }
  const complaint = await Complaint.findById(id);
  if (!complaint) return next(new ErrorResponse('Complaint not found', 404));

  // Access control: municipal always; worker if assigned; citizen if owner
  if (
    req.user.role !== 'municipal' &&
    !(req.user.role === 'worker' && complaint.assignedTo?.toString() === req.user.id) &&
    !(req.user.role === 'citizen' && complaint.user?.toString() === req.user.id)
  ) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const updates = await ComplaintUpdate.find({ complaint: id })
    .sort({ createdAt: -1 })
    .populate('by', 'name role workerId')
    .lean();
  res.status(200).json({ success: true, count: updates.length, data: updates });
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
    // Store Cloudinary URLs
    const added = (req.files || []).map(f => f.path);
    complaint.resolutionDetails[field].push(...added);

    await complaint.save();
    res.status(200).json({ success: true, data: complaint });
  })
];
