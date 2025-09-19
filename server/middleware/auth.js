const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // Set token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Restrict to the single designated municipal head account (by email)
exports.municipalHeadOnly = (req, res, next) => {
  const allowedEmail = (process.env.MUNICIPAL_HEAD_EMAIL || '').toLowerCase();
  const userEmail = (req.user?.email || '').toLowerCase();

  if (!req.user || req.user.role !== 'municipal') {
    return next(new ErrorResponse('Only municipal head can access this route', 403));
  }

  if (!allowedEmail || userEmail !== allowedEmail) {
    return next(new ErrorResponse('This route is restricted to the designated municipal head', 403));
  }

  next();
};
