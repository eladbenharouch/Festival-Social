const navLinks =
  document.getElementById('navLinks');

const ticketForm =
  document.getElementById('ticketForm');

const ticketList =
  document.getElementById('ticketList');

const ticketError =
  document.getElementById('ticketError');

let currentUser = null;

const demoTickets =
[
  {
    _id: 'demo-1',
    seller: { username: 'maya.festival' },
    eventName: 'OFFER NISSIM',
    eventDate: '2026-09-18',
    originalPrice: 350,
    askingPrice: 320,
    contact: '050-381-2457',
    notes:
      'Selling one ticket. Plans changed and I cannot make it anymore.',
    interestedUsers:
    [
      { username: 'daniel.beats' },
      { username: 'noa.raves' }
    ],
    comments:
    [
      {
        _id: 'demo-comment-1',
        author: { username: 'daniel.beats' },
        text: 'Is the ticket still available?'
      },
      {
        _id: 'demo-comment-2',
        author: { username: 'maya.festival' },
        text: 'Yes! Still available.'
      }
    ],
    sold: false,
    demo: true
  },

  {
    _id: 'demo-2',
    seller: { username: 'daniel.beats' },
    eventName: 'Omri Smadar',
    eventDate: '2026-09-24',
    originalPrice: 180,
    askingPrice: 150,
    contact: '052-714-6390',
    notes:
      'One ticket available. Transfer immediately after payment.',
    interestedUsers:
    [
      { username: 'omer.nights' }
    ],
    comments:
    [
      {
        _id: 'demo-comment-3',
        author: { username: 'omer.nights' },
        text: 'Can you transfer the ticket today?'
      }
    ],
    sold: false,
    demo: true
  },

  {
    _id: 'demo-3',
    seller: { username: 'noa.raves' },
    eventName: 'Tomorrowland',
    eventDate: '2026-07-17',
    originalPrice: 1450,
    askingPrice: 1350,
    contact: '054-662-8143',
    notes:
      'Selling one festival ticket because I cannot travel.',
    interestedUsers:
    [
      { username: 'lior.music' },
      { username: 'shira.dance' },
      { username: 'omer.nights' }
    ],
    comments: [],
    sold: false,
    demo: true
  },

  {
    _id: 'demo-4',
    seller: { username: 'lior.music' },
    eventName: 'Burning Man',
    eventDate: '2026-08-30',
    originalPrice: 2100,
    askingPrice: 2000,
    contact: '050-927-5138',
    notes:
      'Ticket available at original-price-or-less resale.',
    interestedUsers: [],
    comments: [],
    sold: false,
    demo: true
  },

  {
    _id: 'demo-5',
    seller: { username: 'shira.dance' },
    eventName: 'Forever Tel Aviv',
    eventDate: '2026-09-12',
    originalPrice: 220,
    askingPrice: 190,
    contact: '053-448-2016',
    notes:
      'Selling one ticket, QR transfer available.',
    interestedUsers:
    [
      { username: 'maya.festival' }
    ],
    comments: [],
    sold: false,
    demo: true
  },

  {
    _id: 'demo-6',
    seller: { username: 'omer.nights' },
    eventName: 'Mistermiss',
    eventDate: '2026-09-26',
    originalPrice: 160,
    askingPrice: 140,
    contact: '052-309-7741',
    notes:
      'One ticket for sale. Selling below original price.',
    interestedUsers: [],
    comments: [],
    sold: false,
    demo: true
  }
];

async function init()
{
  try
  {
    const result =
      await getCurrentUser();

    currentUser =
      result && result.user
        ? result.user
        : null;

    if (!currentUser)
    {
      window.location.href =
        '/login.html';

      return;
    }

    renderNav(
      navLinks,
      currentUser,
      'tickets'
    );

    setupForm();

    await loadTickets();
  }
  catch (err)
  {
    window.location.href =
      '/login.html';
  }
}

async function loadTickets()
{
  try
  {
    const result =
      await apiRequest(
        '/api/tickets'
      );

    const mongoTickets =
      result &&
      Array.isArray(result.tickets)
        ? result.tickets
        : [];

    renderTickets(
      [
        ...mongoTickets,
        ...demoTickets
      ]
    );
  }
  catch (err)
  {
    renderTickets(demoTickets);

    showToast(
      'Could not load saved ticket listings.',
      'error'
    );
  }
}

function setupForm()
{
  ticketForm.addEventListener(
    'submit',
    async (event) =>
    {
      event.preventDefault();

      clearError();

      const eventName =
        document
          .getElementById('ticketEvent')
          .value
          .trim();

      const eventDate =
        document
          .getElementById('ticketDate')
          .value;

      const originalPrice =
        Number(
          document
            .getElementById(
              'ticketOriginalPrice'
            )
            .value
        );

      const askingPrice =
        Number(
          document
            .getElementById(
              'ticketSellingPrice'
            )
            .value
        );

      const contact =
        document
          .getElementById(
            'ticketContact'
          )
          .value
          .trim();

      const notes =
        document
          .getElementById(
            'ticketDetails'
          )
          .value
          .trim();

      if (
        !eventName ||
        !eventDate ||
        !originalPrice ||
        !askingPrice ||
        !contact
      )
      {
        showError(
          'Please complete all required fields.'
        );

        return;
      }

      if (
        originalPrice <= 0 ||
        askingPrice <= 0
      )
      {
        showError(
          'Ticket prices must be greater than zero.'
        );

        return;
      }

      if (
        askingPrice >
        originalPrice
      )
      {
        showError(
          'Selling price cannot be higher than the original ticket price.'
        );

        return;
      }

      try
      {
        await apiRequest(
          '/api/tickets',
          {
            method: 'POST',

            body:
              JSON.stringify(
                {
                  eventName,
                  eventDate,
                  originalPrice,
                  askingPrice,
                  contact,
                  notes
                }
              )
          }
        );

        ticketForm.reset();

        showToast(
          'Ticket listing published!',
          'success'
        );

        await loadTickets();
      }
      catch (err)
      {
        showError(
          err.message ||
          'Failed to publish ticket listing.'
        );
      }
    }
  );
}

function renderTickets(tickets)
{
  if (!tickets.length)
  {
    ticketList.innerHTML = `
      <p class="empty-message">
        No tickets are available right now.
      </p>
    `;

    return;
  }

  ticketList.innerHTML =
    tickets
      .map(
        ticket =>
          ticketCardHtml(ticket)
      )
      .join('');

  tickets.forEach(
    ticket =>
    {
      setupTicketActions(ticket);
    }
  );
}

function setupTicketActions(ticket)
{
  if (ticket.demo)
  {
    return;
  }

  if (isOwnTicket(ticket))
  {
    const deleteButton =
      document.getElementById(
        `delete-ticket-${ticket._id}`
      );

    if (deleteButton)
    {
      deleteButton.addEventListener(
        'click',
        () =>
          deleteTicket(ticket._id)
      );
    }

    const soldButton =
      document.getElementById(
        `sold-ticket-${ticket._id}`
      );

    if (soldButton)
    {
      soldButton.addEventListener(
        'click',
        () =>
          markAsSold(ticket._id)
      );
    }
  }

  if (!ticket.sold)
  {
    const interestButton =
      document.getElementById(
        `interest-ticket-${ticket._id}`
      );

    if (interestButton)
    {
      interestButton.addEventListener(
        'click',
        () =>
          toggleInterest(ticket._id)
      );
    }

    const commentForm =
      document.getElementById(
        `comment-form-${ticket._id}`
      );

    if (commentForm)
    {
      commentForm.addEventListener(
        'submit',
        event =>
          addComment(
            event,
            ticket._id
          )
      );
    }
  }

  const deleteCommentButtons =
    document.querySelectorAll(
      `[data-ticket-id="${ticket._id}"][data-comment-id]`
    );

  deleteCommentButtons.forEach(
    button =>
    {
      button.addEventListener(
        'click',
        () =>
          deleteComment(
            ticket._id,
            button.dataset.commentId
          )
      );
    }
  );
}

function isOwnTicket(ticket)
{
  if (
    !ticket.seller ||
    !currentUser
  )
  {
    return false;
  }

  const sellerId =
    ticket.seller._id ||
    ticket.seller.id ||
    ticket.seller;

  const currentUserId =
    currentUser._id ||
    currentUser.id;

  return (
    String(sellerId) ===
    String(currentUserId)
  );
}

function isCurrentUserInterested(ticket)
{
  if (
    !currentUser ||
    !Array.isArray(
      ticket.interestedUsers
    )
  )
  {
    return false;
  }

  const currentUserId =
    currentUser._id ||
    currentUser.id;

  return ticket.interestedUsers.some(
    user =>
    {
      const userId =
        user &&
        (
          user._id ||
          user.id
        )
          ? user._id || user.id
          : user;

      return (
        String(userId) ===
        String(currentUserId)
      );
    }
  );
}

function isOwnComment(comment)
{
  if (
    !comment.author ||
    !currentUser
  )
  {
    return false;
  }

  const authorId =
    comment.author._id ||
    comment.author.id ||
    comment.author;

  const currentUserId =
    currentUser._id ||
    currentUser.id;

  return (
    String(authorId) ===
    String(currentUserId)
  );
}

function ticketCardHtml(ticket)
{
  const sellerName =
    ticket.seller &&
    ticket.seller.username
      ? ticket.seller.username
      : 'Festival Social user';

  const dateText =
    ticket.eventDate
      ? new Date(
          ticket.eventDate
        ).toLocaleDateString()
      : '';

  const discount =
    Number(ticket.originalPrice) -
    Number(ticket.askingPrice);

  const interestedUsers =
    Array.isArray(ticket.interestedUsers)
      ? ticket.interestedUsers
      : [];

  const comments =
    Array.isArray(ticket.comments)
      ? ticket.comments
      : [];

  const interested =
    isCurrentUserInterested(ticket);

  return `
    <article
      class="card-flat ticket-card ${
        ticket.sold
          ? 'ticket-card-sold'
          : ''
      }"
    >

      <div class="ticket-card-top">

        <div>
          <span class="category-badge">
            Ticket Resale
          </span>

          ${
            ticket.demo
              ? `
                <span class="category-badge">
                  Demo listing
                </span>
              `
              : `
                <span class="category-badge">
                  Community listing
                </span>
              `
          }

          ${
            ticket.sold
              ? `
                <span class="category-badge ticket-sold-badge">
                  SOLD
                </span>
              `
              : ''
          }
        </div>

        ${
          !ticket.demo &&
          isOwnTicket(ticket)
            ? `
              <div class="ticket-owner-actions">

                ${
                  !ticket.sold
                    ? `
                      <button
                        type="button"
                        class="btn-small ticket-sold-btn"
                        id="sold-ticket-${ticket._id}"
                      >
                        Mark as sold
                      </button>
                    `
                    : ''
                }

                <button
                  type="button"
                  class="btn-small btn-danger"
                  id="delete-ticket-${ticket._id}"
                >
                  Delete
                </button>

              </div>
            `
            : ''
        }

      </div>

      <h3>
        ${escapeHtml(ticket.eventName)}
      </h3>

      <p class="meta">
        Sold by
        ${escapeHtml(sellerName)}

        ${
          dateText
            ? `&middot; ${escapeHtml(dateText)}`
            : ''
        }
      </p>

      <div class="ticket-price-row">

        <div>
          <span class="ticket-price-label">
            Selling price
          </span>

          <strong class="ticket-selling-price">
            ₪${Number(ticket.askingPrice).toFixed(0)}
          </strong>
        </div>

        <div>
          <span class="ticket-price-label">
            Original price
          </span>

          <span class="ticket-original-price">
            ₪${Number(ticket.originalPrice).toFixed(0)}
          </span>
        </div>

      </div>

      ${
        discount > 0
          ? `
            <p class="ticket-saving">
              ₪${discount.toFixed(0)}
              below original price
            </p>
          `
          : `
            <p class="ticket-saving">
              Listed at original price
            </p>
          `
      }

      ${
        ticket.notes
          ? `
            <p>
              ${escapeHtml(ticket.notes)}
            </p>
          `
          : ''
      }

      <div class="ticket-contact">

        <strong>
          📞 Phone:
        </strong>

        <span>
          ${escapeHtml(ticket.contact)}
        </span>

      </div>

      ${
        ticket.sold
          ? `
            <div class="ticket-sold-message">
              ✓ This ticket has been sold.
            </div>
          `
          : `
            <div class="ticket-social-actions">

              ${
                ticket.demo
                  ? `
                    <button
                      type="button"
                      class="btn-outline ticket-interest-btn"
                      disabled
                    >
                      ♡ I'm interested
                    </button>
                  `
                  : `
                    <button
                      type="button"
                      class="btn-outline ticket-interest-btn ${
                        interested
                          ? 'active'
                          : ''
                      }"
                      id="interest-ticket-${ticket._id}"
                    >
                      ${
                        interested
                          ? '♥ Interested'
                          : "♡ I'm interested"
                      }
                    </button>
                  `
              }

              <span class="ticket-interest-count">
                ${interestedUsers.length}
                ${
                  interestedUsers.length === 1
                    ? 'person interested'
                    : 'people interested'
                }
              </span>

            </div>
          `
      }

      ${
        interestedUsers.length
          ? `
            <p class="ticket-interested-users">
              Interested:
              ${interestedUsers
                .map(
                  user =>
                    escapeHtml(
                      user.username ||
                      'Festival Social user'
                    )
                )
                .join(', ')}
            </p>
          `
          : ''
      }

      <div class="ticket-comments">

        <h4>
          Comments
          <span>
            (${comments.length})
          </span>
        </h4>

        <div class="ticket-comments-list">

          ${
            comments.length
              ? comments
                  .map(
                    comment =>
                      commentHtml(
                        ticket,
                        comment
                      )
                  )
                  .join('')
              : `
                <p class="empty-message">
                  No comments yet.
                </p>
              `
          }

        </div>

        ${
          ticket.sold
            ? `
              <p class="meta">
                Comments are closed because this ticket has been sold.
              </p>
            `
            : ticket.demo
              ? `
                <p class="meta">
                  Demo listing — interactions are read-only.
                </p>
              `
              : `
                <form
                  class="ticket-comment-form"
                  id="comment-form-${ticket._id}"
                >

                  <input
                    type="text"
                    maxlength="500"
                    placeholder="Ask the seller a question..."
                    required
                  >

                  <button
                    type="submit"
                    class="btn-small"
                  >
                    Comment
                  </button>

                </form>
              `
        }

      </div>

    </article>
  `;
}

function commentHtml(
  ticket,
  comment
)
{
  const username =
    comment.author &&
    comment.author.username
      ? comment.author.username
      : 'Festival Social user';

  return `
    <div class="ticket-comment">

      <div>
        <strong>
          ${escapeHtml(username)}
        </strong>

        <span>
          ${escapeHtml(comment.text)}
        </span>
      </div>

      ${
        !ticket.demo &&
        isOwnComment(comment)
          ? `
            <button
              type="button"
              class="ticket-comment-delete"
              data-ticket-id="${ticket._id}"
              data-comment-id="${comment._id}"
              title="Delete comment"
            >
              ×
            </button>
          `
          : ''
      }

    </div>
  `;
}

async function toggleInterest(ticketId)
{
  try
  {
    await apiRequest(
      `/api/tickets/${ticketId}/interest`,
      {
        method: 'POST'
      }
    );

    await loadTickets();
  }
  catch (err)
  {
    showToast(
      err.message ||
      'Failed to update interest.',
      'error'
    );
  }
}

async function addComment(
  event,
  ticketId
)
{
  event.preventDefault();

  const input =
    event.currentTarget
      .querySelector('input');

  const text =
    input.value.trim();

  if (!text)
  {
    return;
  }

  try
  {
    await apiRequest(
      `/api/tickets/${ticketId}/comments`,
      {
        method: 'POST',

        body:
          JSON.stringify(
            {
              text
            }
          )
      }
    );

    input.value = '';

    showToast(
      'Comment added!',
      'success'
    );

    await loadTickets();
  }
  catch (err)
  {
    showToast(
      err.message ||
      'Failed to add comment.',
      'error'
    );
  }
}

async function deleteComment(
  ticketId,
  commentId
)
{
  try
  {
    await apiRequest(
      `/api/tickets/${ticketId}/comments/${commentId}`,
      {
        method: 'DELETE'
      }
    );

    showToast(
      'Comment deleted',
      'success'
    );

    await loadTickets();
  }
  catch (err)
  {
    showToast(
      err.message ||
      'Failed to delete comment.',
      'error'
    );
  }
}

async function markAsSold(ticketId)
{
  const confirmed =
    window.confirm(
      'Mark this ticket as sold?'
    );

  if (!confirmed)
  {
    return;
  }

  try
  {
    await apiRequest(
      `/api/tickets/${ticketId}/sold`,
      {
        method: 'PATCH'
      }
    );

    showToast(
      'Ticket marked as sold!',
      'success'
    );

    await loadTickets();
  }
  catch (err)
  {
    showToast(
      err.message ||
      'Failed to mark ticket as sold.',
      'error'
    );
  }
}

async function deleteTicket(ticketId)
{
  const confirmed =
    window.confirm(
      'Delete this ticket listing?'
    );

  if (!confirmed)
  {
    return;
  }

  try
  {
    await apiRequest(
      `/api/tickets/${ticketId}`,
      {
        method: 'DELETE'
      }
    );

    showToast(
      'Ticket listing deleted',
      'success'
    );

    await loadTickets();
  }
  catch (err)
  {
    showToast(
      err.message ||
      'Failed to delete ticket listing.',
      'error'
    );
  }
}

function showError(message)
{
  ticketError.textContent =
    message;

  ticketError.classList.add(
    'visible'
  );
}

function clearError()
{
  ticketError.textContent = '';

  ticketError.classList.remove(
    'visible'
  );
}

function showToast(
  message,
  type
)
{
  const toast =
    document.getElementById('toast');

  toast.textContent =
    message;

  toast.className =
    `toast visible ${type}`;

  setTimeout(
    () =>
    {
      toast.classList.remove(
        'visible'
      );
    },
    2500
  );
}

init();