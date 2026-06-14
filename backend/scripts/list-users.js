const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} users:`);
  users.forEach(u => console.log(u));
  
  const pending = await mongoose.connection.db.collection('pendingregistrations').find({}).toArray();
  console.log(`Found ${pending.length} pending:`);
  pending.forEach(p => console.log(p));
  
  process.exit(0);
}

listUsers().catch(console.error);
