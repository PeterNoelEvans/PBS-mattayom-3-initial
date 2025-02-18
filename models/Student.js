const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    nickname: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    results: [{
        quizTitle: String,
        setNumber: Number,
        score: Number,
        totalQuestions: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        answers: {
            type: Map,
            of: Number
        }
    }],
    sessions: [{
        token: {
            type: String,
            required: true
        }
    }]
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 