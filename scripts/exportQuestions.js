require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const Quiz = require('../models/Quiz');

async function exportQuestions() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all quizzes
        const quizzes = await Quiz.find();
        console.log(`Found ${quizzes.length} question sets`);

        // Save to a JSON file
        await fs.writeFile(
            'questionSets.json', 
            JSON.stringify(quizzes, null, 2)
        );
        
        console.log('Successfully exported question sets to questionSets.json');
        console.log('You can copy this file to your new computer and use importQuestions.js to import it');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

exportQuestions(); 