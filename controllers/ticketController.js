const TicketListing = require('../models/TicketListing');

async function getTickets(req, res)
{
  try
  {
    const tickets =
      await TicketListing.find()
        .populate(
          'seller',
          'username avatarUrl'
        )
        .populate(
          'interestedUsers',
          'username avatarUrl'
        )
        .populate(
          'comments.author',
          'username avatarUrl'
        )
        .sort(
          { sold: 1, createdAt: -1 }
        );

    res.json(
      {
        tickets
      }
    );
  }
  catch (err)
  {
    console.error(err);

    res.status(500).json(
      {
        message:
          'Failed to load ticket listings.'
      }
    );
  }
}

async function createTicket(req, res)
{
  try
  {
    const {
      eventName,
      eventDate,
      originalPrice,
      askingPrice,
      contact,
      notes
    } = req.body;

    if (
      !eventName ||
      !eventDate ||
      originalPrice === undefined ||
      askingPrice === undefined ||
      !contact
    )
    {
      return res.status(400).json(
        {
          message:
            'Please complete all required fields.'
        }
      );
    }

    if (
      Number(originalPrice) <= 0 ||
      Number(askingPrice) <= 0
    )
    {
      return res.status(400).json(
        {
          message:
            'Ticket prices must be greater than zero.'
        }
      );
    }

    if (
      Number(askingPrice) >
      Number(originalPrice)
    )
    {
      return res.status(400).json(
        {
          message:
            'Selling price cannot be higher than the original ticket price.'
        }
      );
    }

    const ticket =
      await TicketListing.create(
        {
          seller:
            req.session.userId,

          eventName:
            eventName.trim(),

          eventDate,

          originalPrice:
            Number(originalPrice),

          askingPrice:
            Number(askingPrice),

          contact:
            contact.trim(),

          notes:
            notes
              ? notes.trim()
              : '',

          sold: false
        }
      );

    await ticket.populate(
      'seller',
      'username avatarUrl'
    );

    res.status(201).json(
      {
        message:
          'Ticket listing published successfully.',

        ticket
      }
    );
  }
  catch (err)
  {
    console.error(err);

    res.status(400).json(
      {
        message:
          err.message ||
          'Failed to publish ticket listing.'
      }
    );
  }
}

async function toggleInterest(req, res)
{
  try
  {
    const ticket =
      await TicketListing.findById(
        req.params.id
      );

    if (!ticket)
    {
      return res.status(404).json(
        {
          message:
            'Ticket listing not found.'
        }
      );
    }

    if (ticket.sold)
    {
      return res.status(400).json(
        {
          message:
            'This ticket has already been sold.'
        }
      );
    }

    const userId =
      String(req.session.userId);

    const alreadyInterested =
      ticket.interestedUsers.some(
        id =>
          String(id) === userId
      );

    if (alreadyInterested)
    {
      ticket.interestedUsers =
        ticket.interestedUsers.filter(
          id =>
            String(id) !== userId
        );
    }
    else
    {
      ticket.interestedUsers.push(
        req.session.userId
      );
    }

    await ticket.save();

    await ticket.populate(
      'interestedUsers',
      'username avatarUrl'
    );

    res.json(
      {
        interested:
          !alreadyInterested,

        interestedUsers:
          ticket.interestedUsers,

        interestedCount:
          ticket.interestedUsers.length
      }
    );
  }
  catch (err)
  {
    console.error(err);

    res.status(500).json(
      {
        message:
          'Failed to update interest.'
      }
    );
  }
}

async function addComment(req, res)
{
  try
  {
    const text =
      req.body.text
        ? req.body.text.trim()
        : '';

    if (!text)
    {
      return res.status(400).json(
        {
          message:
            'Comment cannot be empty.'
        }
      );
    }

    const ticket =
      await TicketListing.findById(
        req.params.id
      );

    if (!ticket)
    {
      return res.status(404).json(
        {
          message:
            'Ticket listing not found.'
        }
      );
    }

    if (ticket.sold)
    {
      return res.status(400).json(
        {
          message:
            'Comments are closed because this ticket has been sold.'
        }
      );
    }

    ticket.comments.push(
      {
        author:
          req.session.userId,

        text
      }
    );

    await ticket.save();

    await ticket.populate(
      'comments.author',
      'username avatarUrl'
    );

    res.status(201).json(
      {
        message:
          'Comment added successfully.',

        comments:
          ticket.comments
      }
    );
  }
  catch (err)
  {
    console.error(err);

    res.status(500).json(
      {
        message:
          'Failed to add comment.'
      }
    );
  }
}

async function deleteComment(req, res)
{
  try
  {
    const ticket =
      await TicketListing.findById(
        req.params.id
      );

    if (!ticket)
    {
      return res.status(404).json(
        {
          message:
            'Ticket listing not found.'
        }
      );
    }

    const comment =
      ticket.comments.id(
        req.params.commentId
      );

    if (!comment)
    {
      return res.status(404).json(
        {
          message:
            'Comment not found.'
        }
      );
    }

    if (
      String(comment.author) !==
      String(req.session.userId)
    )
    {
      return res.status(403).json(
        {
          message:
            'You can only delete your own comments.'
        }
      );
    }

    comment.deleteOne();

    await ticket.save();

    res.json(
      {
        message:
          'Comment deleted successfully.'
      }
    );
  }
  catch (err)
  {
    console.error(err);

    res.status(500).json(
      {
        message:
          'Failed to delete comment.'
      }
    );
  }
}

async function markAsSold(req, res)
{
  try
  {
    const ticket =
      await TicketListing.findById(
        req.params.id
      );

    if (!ticket)
    {
      return res.status(404).json(
        {
          message:
            'Ticket listing not found.'
        }
      );
    }

    if (
      String(ticket.seller) !==
      String(req.session.userId)
    )
    {
      return res.status(403).json(
        {
          message:
            'You can only update your own ticket listings.'
        }
      );
    }

    ticket.sold = true;

    await ticket.save();

    res.json(
      {
        message:
          'Ticket marked as sold.',

        ticket
      }
    );
  }
  catch (err)
  {
    console.error(err);

    res.status(500).json(
      {
        message:
          'Failed to mark ticket as sold.'
      }
    );
  }
}

async function deleteTicket(req, res)
{
  try
  {
    const ticket =
      await TicketListing.findById(
        req.params.id
      );

    if (!ticket)
    {
      return res.status(404).json(
        {
          message:
            'Ticket listing not found.'
        }
      );
    }

    if (
      String(ticket.seller) !==
      String(req.session.userId)
    )
    {
      return res.status(403).json(
        {
          message:
            'You can only delete your own ticket listings.'
        }
      );
    }

    await ticket.deleteOne();

    res.json(
      {
        message:
          'Ticket listing deleted successfully.'
      }
    );
  }
  catch (err)
  {
    console.error(err);

    res.status(500).json(
      {
        message:
          'Failed to delete ticket listing.'
      }
    );
  }
}

module.exports =
{
  getTickets,
  createTicket,
  toggleInterest,
  addComment,
  deleteComment,
  markAsSold,
  deleteTicket
};