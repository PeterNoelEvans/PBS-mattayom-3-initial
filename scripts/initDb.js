require('dotenv').config();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Student = require('../models/Student');
const fs = require('fs').promises;
const path = require('path');

const sampleQuizData = {
    setId: "grammar-basics-1",
    name: "Basic Grammar Set 1",
    title: "English Grammar Basics",
    questions: [
        {
            text: "Which sentence is grammatically correct?",
            options: [
                "She don't like ice cream.",
                "She doesn't likes ice cream.",
                "She doesn't like ice cream.",
                "She not like ice cream."
            ],
            correctAnswer: 2,
            topic: "Present Simple",
            explanation: "When using the third person singular (he/she/it) with 'doesn't', the main verb remains in its base form."
        },
        {
            text: "What is the meaning of 'enormous'?",
            options: [
                "Very small",
                "Very large",
                "Very fast",
                "Very slow"
            ],
            correctAnswer: 1,
            topic: "Vocabulary",
            explanation: "Enormous means extremely large in size or amount."
        }
    ]
};

async function initializeDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Only clear student data, preserve quizzes
        await Student.deleteMany({});
        console.log('Cleared existing student data');

        // Check if we need to restore questions
        const existingQuizzes = await Quiz.find();
        if (existingQuizzes.length === 0) {
            try {
                // Try to load questions from temp.json
                const tempPath = path.join(__dirname, '..', '..', 'temp.json');
                const questionsData = await fs.readFile(tempPath, 'utf8');
                const quizData = JSON.parse(questionsData);
                
                const quiz = new Quiz(quizData);
                await quiz.save();
                console.log('Restored quiz data from temp.json');
            } catch (error) {
                console.log('No existing quiz data found, inserting sample quiz');
                const quiz = new Quiz(sampleQuizData);
                await quiz.save();
            }
        } else {
            console.log('Preserved existing quiz data');
        }

        console.log('Database initialization completed');
        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

initializeDatabase(); 