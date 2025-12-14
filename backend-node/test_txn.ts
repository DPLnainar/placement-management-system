
import mongoose from 'mongoose';
import { connectDB } from './src/config/database';

async function testTxn() {
    try {
        await connectDB();
        const session = await mongoose.startSession();
        console.log('Session started');
        session.startTransaction();
        console.log('Transaction started');
        await session.abortTransaction();
        session.endSession();
        console.log('Transaction supported and worked');
        process.exit(0);
    } catch (error: any) {
        console.error('Transaction failed:', error.message);
        console.error('Code:', error.code);
        process.exit(1);
    }
}

testTxn();
