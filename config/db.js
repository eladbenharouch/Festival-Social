const mongoose = require('mongoose');

async function connectDB() 
{
  try 
  {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('התחברות ל-MongoDB הצליחה');
  } 
  catch (err) 
  {
    console.error('שגיאה בהתחברות ל-MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;