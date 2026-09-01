const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, groupController.createGroup);
router.get('/', requireAuth, groupController.listGroups);
router.get('/mine', requireAuth, groupController.getMyGroups);
router.get('/:id', requireAuth, groupController.getGroupById);
router.put('/:id', requireAuth, groupController.updateGroup);
router.delete('/:id', requireAuth, groupController.deleteGroup);
router.post('/:id/join', requireAuth, groupController.joinGroup);
router.post('/:id/leave', requireAuth, groupController.leaveGroup);
router.delete('/:id/members/:userId', requireAuth, groupController.removeMember);

module.exports = router;