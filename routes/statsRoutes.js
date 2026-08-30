const express = require('express');
const { getPostsByGenre, getPostsByGroup } = require('../controllers/statsController');

const router = express.Router();

router.get('/posts-by-genre', getPostsByGenre);
router.get('/posts-by-group', getPostsByGroup);

module.exports = router;