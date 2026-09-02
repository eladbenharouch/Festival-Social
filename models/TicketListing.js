const mongoose = require('mongoose');

const ticketCommentSchema =
  new mongoose.Schema(
    {
      author:
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },

      text:
      {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },

      createdAt:
      {
        type: Date,
        default: Date.now
      }
    }
  );

const ticketListingSchema =
  new mongoose.Schema(
    {
      seller:
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },

      eventName:
      {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
      },

      eventDate:
      {
        type: Date,
        required: true
      },

      originalPrice:
      {
        type: Number,
        required: true,
        min: 0
      },

      askingPrice:
      {
        type: Number,
        required: true,
        min: 0
      },

      contact:
      {
        type: String,
        required: true,
        trim: true,
        maxlength: 30
      },

      notes:
      {
        type: String,
        default: '',
        trim: true,
        maxlength: 500
      },
      sold:
{
  type: Boolean,
  default: false
},

      interestedUsers:
      {
        type:
          [
            {
              type:
                mongoose.Schema.Types.ObjectId,

              ref: 'User'
            }
          ],

        default: []
      },

      comments:
      {
        type:
          [ticketCommentSchema],

        default: []
      }
    },
    {
      timestamps: true
    }
  );

ticketListingSchema.pre(
  'validate',
  function validateTicketPrice()
  {
    if (
      this.askingPrice >
      this.originalPrice
    )
    {
      throw new Error(
        'Selling price cannot be higher than the original ticket price.'
      );
    }
  }
);

module.exports =
  mongoose.model(
    'TicketListing',
    ticketListingSchema
  );