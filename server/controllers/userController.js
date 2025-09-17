const mongoose = require('mongoose');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid user id', 400));
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid user id', 400));
  }
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: user });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res, next) => {
  // Default to worker role if not provided
  if (!req.body.role) req.body.role = 'worker';
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid user id', 400));
  }
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid user id', 400));
  }
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update user points
// @route   PUT /api/users/:id/points
// @access  Private/Admin
const updateUserPoints = asyncHandler(async (req, res, next) => {
  const { points, reason } = req.body;

  // Only Municipal Head can apply rewards/penalties
  if (!req.user || req.user.role !== 'municipal') {
    return next(new ErrorResponse('Only municipal head can update points', 403));
  }

  if (!points || isNaN(points)) {
    return next(new ErrorResponse('Please provide valid points', 400));
  }

  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Update points
  user.points += parseInt(points);
  
  // Add to points history
  user.pointsHistory = user.pointsHistory || [];
  user.pointsHistory.push({
    points: parseInt(points),
    reason: reason || 'Points updated by admin',
    date: Date.now()
  });

  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserPoints
};

// @desc    Public: Get worker basic info by workerId (limited fields)
// @route   GET /api/users/worker/:workerId
// @access  Public
const getWorkerByWorkerId = asyncHandler(async (req, res, next) => {
  const { workerId } = req.params;
  if (!workerId) return next(new ErrorResponse('workerId is required', 400));
  const user = await User.findOne({ workerId, role: 'worker' }).select('name email workerId role');
  if (!user) return next(new ErrorResponse('Worker not found', 404));
  res.status(200).json({ success: true, data: user });
});

module.exports.getWorkerByWorkerId = getWorkerByWorkerId;
