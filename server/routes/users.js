const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserPoints,
  getWorkerByWorkerId
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

router
  .route('/')
  .get(advancedResults(User), getUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

// Update user points (for rewards/penalties) – only the designated municipal head
router.put('/:id/points', municipalHeadOnly, updateUserPoints);

module.exports = router;
