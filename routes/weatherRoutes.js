const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, weatherController.getWeather);

module.exports = router;