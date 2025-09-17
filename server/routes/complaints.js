const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createComplaint,
  getComplaints,
  getComplaint,
  assignComplaint,
  updateComplaintStatus,
  uploadComplaintImages,
  uploadResolutionImages
} = require('../controllers/complaintController');

const router = express.Router();

// All complaint routes are protected
router.use(protect);

// Citizen create complaint with optional images
router.post('/', uploadComplaintImages, authorize('citizen', 'municipal'), createComplaint);

// List complaints based on role
router.get('/', getComplaints);

// Get one
router.get('/:id', getComplaint);

// Assign to worker (municipal only)
router.put('/:id/assign', authorize('municipal'), assignComplaint);

// Update status (worker or municipal)
router.put('/:id/status', authorize('worker', 'municipal'), updateComplaintStatus);

// Upload resolution images (worker)
router.post('/:id/images', authorize('worker'), ...uploadResolutionImages);

module.exports = router;
