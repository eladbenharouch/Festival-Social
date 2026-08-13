function requireAuth(req, res, next)
{
  if (!req.session.userId)
  {
    return res.status(401).json({ error: 'You must be logged in to do that' });
  }

  return next();
}

module.exports = { requireAuth };
