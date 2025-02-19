require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const Quiz = require('../models/Quiz');

async function importQuestions() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Read the JSON file
        const data = await fs.readFile('questionSets.json', 'utf8');
        const quizzes = JSON.parse(data);
        console.log(`Found ${quizzes.length} question sets to import`);

        // Clear existing quizzes
        await Quiz.deleteMany({});
        console.log('Cleared existing question sets');

        // Import quizzes
        await Quiz.insertMany(quizzes);
        console.log('Successfully imported all question sets');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

importQuestions(); 