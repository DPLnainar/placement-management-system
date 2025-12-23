require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        // Print hidden URI for debugging if needed, but keeping it safe for now
        // console.log("URI:", process.env.MONGODB_URI); 

        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
        console.log(`Used Database: ${conn.connection.name}`);
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
