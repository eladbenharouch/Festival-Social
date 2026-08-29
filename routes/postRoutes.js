const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, postController.createPost);
router.get('/feed', requireAuth, postController.getFeed);
router.get('/group/:groupId', postController.getPostsByGroup);
router.get('/:id', postController.getPostById);
router.put('/:id', requireAuth, postController.updatePost);
router.delete('/:id', requireAuth, postController.deletePost);
router.post('/:id/like', requireAuth, postController.toggleLike);
router.post('/:id/comments', requireAuth, postController.addComment);
router.delete('/:id/comments/:commentId', requireAuth, postController.deleteComment);

module.exports = router;
