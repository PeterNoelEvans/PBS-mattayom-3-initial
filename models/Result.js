const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    overallProgress: {
        type: Number,
        default: 0
    },
    sections: [{
        sectionTitle: String,
        score: Number,
        totalQuestions: Number,
        stage: {
            type: Number,
            default: 1
        },
        answers: [{
            questionId: mongoose.Schema.Types.ObjectId,
            correct: Boolean,
            topic: String
        }],
        completedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result; 