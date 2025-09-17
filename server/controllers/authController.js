const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, address } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    address
  });
  // Create token
  const token = user.getSignedJwtToken();
  res.status(200).json({ success: true, token });
});

// @desc    Municipal Head direct login via env credentials
// @route   POST /api/auth/municipal-login
// @access  Public (but guarded by env match)
exports.municipalHeadLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const envEmail = (process.env.MUNICIPAL_HEAD_EMAIL || '').toLowerCase();
  const envPass = process.env.MUNICIPAL_HEAD_PASSWORD || process.env.MUNICIPAL_HEAD_Password || '';

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }
  if (!envEmail || !envPass) {
    return next(new ErrorResponse('Municipal head credentials not configured', 500));
  }

  if (email.toLowerCase() !== envEmail || password !== envPass) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Ensure a municipal user exists in DB for this email
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Municipal Head',
      email,
      password, // will be hashed by pre-save hook
      role: 'municipal',
      address: { location: { type: 'Point', coordinates: [72.8777, 19.076] } }
    });
  } else if (user.role !== 'municipal') {
    // Ensure role is municipal for this special account
    user.role = 'municipal';
    await user.save();
  }

  const token = user.getSignedJwtToken();
  res.status(200).json({ success: true, token, role: 'municipal' });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorResponse('Account is deactivated', 401));
  }

  // Create token
  const token = user.getSignedJwtToken();

  // Get user role for redirection
  const userRole = user.role;

  res.status(200).json({
    success: true,
    token,
    role: userRole
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    address: req.body.address
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

// @desc    Worker login using workerId and password
// @route   POST /api/auth/worker-login
// @access  Public
exports.workerLogin = asyncHandler(async (req, res, next) => {
  const { workerId, password } = req.body;

  if (!workerId || !password) {
    return next(new ErrorResponse('Please provide workerId and password', 400));
  }

  const user = await User.findOne({ workerId, role: 'worker' }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (!user.isActive) {
    return next(new ErrorResponse('Account is deactivated', 401));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const token = user.getSignedJwtToken();
  res.status(200).json({ success: true, token, role: 'worker' });
});
