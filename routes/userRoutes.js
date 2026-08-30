const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', requireAuth, userController.logout);
router.get('/me', userController.getCurrentUser);
router.get('/following', requireAuth, userController.getMyFollowing);
router.get('/followers', requireAuth, userController.getMyFollowers);
router.get('/', requireAuth, userController.getAllUsers);
router.get('/search', requireAuth, userController.searchUsers);
router.put('/me', requireAuth, userController.updateCurrentUser);
router.delete('/me', requireAuth, userController.deleteCurrentUser);
router.get('/me/stats', requireAuth, userController.getMyProfileStats);
router.get('/:id/profile', requireAuth, userController.getUserProfile);
router.get('/:id/followers', requireAuth, userController.getUserFollowers);
router.get('/:id/following', requireAuth, userController.getUserFollowing);
router.post('/:id/follow', requireAuth, userController.followUser);
router.post('/:id/unfollow', requireAuth, userController.unfollowUser);

module.exports = router;
