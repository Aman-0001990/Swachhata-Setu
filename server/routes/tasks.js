const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createTask,
  getTasks,
  getTask,
  assignTask,
  updateTaskStatus,
  deleteTask,
  uploadTaskImages,
  approveTask,
  getTaskUpdates
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

// Upload before/after images for a task (assigned worker)
router.post('/:id/images', authorize('worker', 'municipal'), ...uploadTaskImages);

// Approve and archive a completed task (municipal head)
router.put('/:id/approve', authorize('municipal'), approveTask);

// Task updates (history)
router.get('/:id/updates', authorize('worker', 'municipal'), getTaskUpdates);

module.exports = router;
