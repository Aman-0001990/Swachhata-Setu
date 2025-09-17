const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createTask,
  getTasks,
  getTask,
  assignTask,
  updateTaskStatus,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

// Protect all task routes
router.use(protect);

router
  .route('/')
  .get(getTasks)
  .post(authorize('municipal'), createTask);

router
  .route('/:id')
  .get(getTask)
  .delete(authorize('municipal'), deleteTask);

router.put('/:id/assign', authorize('municipal'), assignTask);
router.put('/:id/status', authorize('worker', 'municipal'), updateTaskStatus);

module.exports = router;
