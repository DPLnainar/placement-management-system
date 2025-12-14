const mongoose = require('mongoose');
require('dotenv').config();

const fixGenderEnum = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('studentdatas');

        // Update all capitalized gender values to lowercase
        const result = await collection.updateMany(
            { 'personal.gender': { $in: ['Male', 'Female', 'Other'] } },
            [
                {
                    $set: {
                        'personal.gender': {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$personal.gender', 'Male'] }, then: 'male' },
                                    { case: { $eq: ['$personal.gender', 'Female'] }, then: 'female' },
                                    { case: { $eq: ['$personal.gender', 'Other'] }, then: 'other' }
                                ],
                                default: '$personal.gender'
                            }
                        }
                    }
                }
            ]
        );

        console.log(`Fixed ${result.modifiedCount} student records`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixGenderEnum();
