const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', requireAuth, userController.logout);
router.get('/me', userController.getCurrentUser);
router.get('/following', requireAuth, userController.getMyFollowing);
router.post('/:id/follow', requireAuth, userController.followUser);
router.post('/:id/unfollow', requireAuth, userController.unfollowUser);

module.exports = router;
