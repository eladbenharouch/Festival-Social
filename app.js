require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/', (req, res) =>
     {
  res.send('השרת עובד!');
    });
const PORT = 3000;
app.listen(PORT, () => 
{
  console.log(`השרת רץ על http://localhost:${PORT}`);
});
    