const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, groupController.createGroup);
router.get('/', groupController.listGroups);
router.get('/mine', requireAuth, groupController.getMyGroups);
router.get('/:id', groupController.getGroupById);
router.put('/:id', requireAuth, groupController.updateGroup);
router.delete('/:id', requireAuth, groupController.deleteGroup);
router.post('/:id/join', requireAuth, groupController.joinGroup);
router.post('/:id/leave', requireAuth, groupController.leaveGroup);

module.exports = router;
