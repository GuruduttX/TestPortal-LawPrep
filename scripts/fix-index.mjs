import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function fix() {
  if (!process.env.MONGODB_URI) {
    console.error('Please define MONGODB_URI in .env.local');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  
  // Drop the collection completely so Mongoose can recreate it with proper indexes
  try {
    await db.collection('attempts').drop();
    console.log('Successfully dropped the "attempts" collection.');
  } catch (err) {
    if (err.code === 26) {
      console.log('Collection "attempts" does not exist, nothing to drop.');
    } else {
      console.error('Error dropping collection:', err);
    }
  }

  mongoose.connection.close();
}

fix().catch(err => {
  console.error(err);
  mongoose.connection.close();
  process.exit(1);
});
