import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * Uses connection string from environment variables
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement';
    const conn = await mongoose.connect(mongoUri);

    console.info(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.info(`✓ Database Name: ${conn.connection.name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error connecting to MongoDB: ${errorMessage}`);
    process.exit(1);
  }
};

export default connectDB;
