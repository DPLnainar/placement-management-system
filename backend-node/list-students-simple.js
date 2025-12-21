const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-system');
        const StudentData = mongoose.model('StudentData', new mongoose.Schema({}, { strict: false, collection: 'studentdatas' }));
        const students = await StudentData.find({}, 'personal.email personal.name').limit(10);
        console.log('--- Existing Students ---');
        students.forEach(s => {
            console.log(`- ${s.personal?.email || s.email || 'No Email'} (${s.personal?.name || 'No Name'})`);
        });
    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

listStudents();
