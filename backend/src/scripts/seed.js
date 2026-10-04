// Builds the demo account by hand: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../database/database.js';
import { rebuildDemo } from './demoData.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../utils/demo.js';

const seed = async () => {
    await connectDB();

    const { invoices } = await rebuildDemo();

    console.log(`\nDemo account rebuilt with ${invoices} invoices.`);
    console.log(`  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
};

seed()
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
        console.log('Seeding failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    });
