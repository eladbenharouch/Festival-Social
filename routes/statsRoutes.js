const express = require('express');
const { getPostsByGenre, getPostsByGroup } = require('../controllers/statsController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/posts-by-genre', requireAuth, getPostsByGenre);
router.get('/posts-by-group', requireAuth, getPostsByGroup);

module.exports = router;