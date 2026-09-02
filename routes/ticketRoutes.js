const express = require('express');

const router = express.Router();

const ticketController =
  require('../controllers/ticketController');

const { requireAuth } =
  require('../middleware/authMiddleware');

router.get(
  '/',
  requireAuth,
  ticketController.getTickets
);

router.post(
  '/',
  requireAuth,
  ticketController.createTicket
);

router.post(
  '/:id/interest',
  requireAuth,
  ticketController.toggleInterest
);

router.post(
  '/:id/comments',
  requireAuth,
  ticketController.addComment
);

router.delete(
  '/:id/comments/:commentId',
  requireAuth,
  ticketController.deleteComment
);

router.patch(
  '/:id/sold',
  requireAuth,
  ticketController.markAsSold
);

router.delete(
  '/:id',
  requireAuth,
  ticketController.deleteTicket
);

module.exports = router;