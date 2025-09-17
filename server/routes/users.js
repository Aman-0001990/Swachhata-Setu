const express = require('express');
const {
  getUsers,
  getUser,
  createWorker,
  updateUser,
  deleteUser,
  updateUserPoints,
  getWorkerByWorkerId,
  listWorkers
} = require('../controllers/userController');
const { protect, authorize, municipalHeadOnly } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const User = require('../models/User');

const router = express.Router();

// Public route to fetch worker details by workerId (limited fields)
router.get('/worker/:workerId', getWorkerByWorkerId);

// All routes are protected and only accessible by admin/municipal
router.use(protect);
router.use(authorize('municipal', 'admin'));
// Additionally restrict critical routes to the designated municipal head
router.use(municipalHeadOnly);

router
  .route('/')
  .get(advancedResults(User), getUsers)
  .post(createWorker);

// List all workers (Worker ID, Name, Phone)
router.get('/workers', listWorkers);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

// Update user points (for rewards/penalties) – only the designated municipal head
router.put('/:id/points', municipalHeadOnly, updateUserPoints);

// (kept above '/:id' to avoid route conflict)

module.exports = router;
