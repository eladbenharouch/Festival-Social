require('dotenv').config();
const connectDB = require('./config/db');
connectDB();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const postRoutes = require('./routes/postRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session(
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie:
  {
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stats', statsRoutes);
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
{
  console.log(`Server running on http://localhost:${PORT}`);
});
