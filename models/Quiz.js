const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    setId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    questions: [{
        text: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }],
        correctAnswer: {
            type: Number,
            required: true
        },
        topic: String,
        explanation: String
    }]
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz; 
module.exports = Quiz; 