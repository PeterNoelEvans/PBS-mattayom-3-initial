require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add root redirect to register.html
app.get('/', (req, res) => {
    res.redirect('/register.html');
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        console.log('Database:', mongoose.connection.name);
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.log('Please make sure MongoDB is running.');
        console.log('Try running: mongod');
        process.exit(1);
    });

// Models
const Student = require('./models/Student');
const Quiz = require('./models/Quiz');
const Result = require('./models/Result');

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { name, nickname } = req.body;

        // Check if student already exists
        const existingStudent = await Student.findOne({ nickname });
        if (existingStudent) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nickname already taken' 
            });
        }

        // Create new student
        const student = new Student({
            name,
            nickname
        });

        await student.save();

        // Generate token
        const token = jwt.sign(
            { studentId: student._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            student: {
                name: student.name,
                nickname: student.nickname
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        console.log('Login attempt with nickname:', req.body.nickname);
        const { nickname } = req.body;

        // Find student
        const student = await Student.findOne({ nickname });
        console.log('Student found:', student ? 'Yes' : 'No');
        
        if (!student) {
            console.log('Student not found with nickname:', nickname);
            return res.status(400).json({ 
                success: false, 
                error: 'Student not found' 
            });
        }

        // Generate token
        const token = jwt.sign(
            { studentId: student._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('Token generated for student:', student.name);

        // Save token to student's sessions
        student.sessions = student.sessions || [];
        student.sessions.push({ token });
        await student.save();
        console.log('Token saved to student sessions');

        res.json({
            success: true,
            token,
            student: {
                name: student.name,
                nickname: student.nickname
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/logout', auth, async (req, res) => {
    try {
        req.student.sessions = req.student.sessions.filter(session => 
            session.token !== req.token
        );
        await req.student.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        res.json({ success: true });
    }
});

// Save quiz results
app.post('/api/results', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const student = await Student.findById(decoded.studentId);
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                error: 'Student not found' 
            });
        }

        // Add the new result
        student.results.push({
            quizTitle: req.body.quizTitle,
            setNumber: req.body.setNumber,
            score: req.body.score,
            totalQuestions: req.body.totalQuestions,
            timestamp: req.body.timestamp || new Date().toISOString()
        });

        await student.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/verify-credentials', async (req, res) => {
    try {
        const { email, password } = req.query;
        const student = await Student.findOne({ email });
        
        if (!student) {
            return res.json({ exists: false });
        }

        const isValidPassword = await student.validatePassword(password);
        res.json({ 
            exists: true, 
            passwordValid: isValidPassword 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student progress
app.get('/api/student/progress', auth, async (req, res) => {
    try {
        const result = await Result.findOne({ student: req.student._id });
        if (!result) {
            return res.json({
                overallProgress: 0,
                sections: {}
            });
        }
        
        const progress = {
            overallProgress: result.overallProgress,
            sections: {}
        };

        result.sections.forEach(section => {
            progress.sections[section.sectionTitle.toLowerCase()] = {
                completed: true,
                score: (section.score / section.totalQuestions) * 100,
                stage: section.stage
            };
        });
        
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start new section
app.post('/api/section/start', auth, async (req, res) => {
    try {
        const { sectionId } = req.body;
        const quiz = await Quiz.findOne({ 'sections.title': sectionId });
        
        if (!quiz) {
            throw new Error('Section not found');
        }

        res.json({ 
            success: true, 
            section: quiz.sections.find(s => s.title.toLowerCase() === sectionId)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add this new route
app.get('/api/student/summary', auth, async (req, res) => {
    try {
        console.log('Fetching summary for student:', req.student._id);
        const result = await Result.findOne({ student: req.student._id });
        console.log('Found result:', result);
        
        // Initialize summary structure
        const summary = {
            sections: [
                {
                    title: 'Grammar',
                    completed: false,
                    score: 0,
                    weakAreas: []
                },
                {
                    title: 'Vocabulary',
                    completed: false,
                    score: 0,
                    weakAreas: []
                },
                {
                    title: 'Reading',
                    completed: false,
                    score: 0,
                    weakAreas: []
                },
                {
                    title: 'Micekings',
                    completed: false,
                    score: 0,
                    weakAreas: []
                }
            ],
            recommendations: []
        };

        if (result) {
            // Process sections from the result
            result.sections.forEach(resultSection => {
                console.log('Processing section:', resultSection.sectionTitle);
                const section = summary.sections.find(s => 
                    s.title.toLowerCase() === resultSection.sectionTitle.toLowerCase()
                );
                
                if (section) {
                    section.completed = true;
                    section.score = (resultSection.score / resultSection.totalQuestions) * 100;
                    
                    // Analyze incorrect answers to identify weak areas
                    resultSection.answers.forEach(answer => {
                        if (!answer.correct && answer.topic) {
                            if (!section.weakAreas.includes(answer.topic)) {
                                section.weakAreas.push(answer.topic);
                            }
                        }
                    });
                }
            });

            // Generate recommendations
            summary.sections.forEach(section => {
                if (section.completed && section.score < 60) {
                    summary.recommendations.push({
                        area: section.title,
                        description: `Focus on improving ${section.title.toLowerCase()} skills`,
                        resources: `Check recommended ${section.title.toLowerCase()} exercises`
                    });
                }
            });
        }

        console.log('Sending summary:', summary);
        res.json(summary);
    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this temporary route to clear results (remove in production)
app.post('/api/reset-progress', auth, async (req, res) => {
    try {
        await Result.deleteMany({ student: req.student._id });
        res.json({ success: true, message: 'Progress reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add this new route for token refresh
app.post('/api/refresh-token', async (req, res) => {
    try {
        const oldToken = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
        const student = await Student.findOne({ 
            _id: decoded._id,
            'sessions.token': oldToken 
        });
        
        if (!student) {
            throw new Error('Invalid token');
        }
        
        // Generate new token
        const newToken = jwt.sign({ _id: student._id }, process.env.JWT_SECRET);
        
        // Update session
        student.sessions = student.sessions.filter(s => s.token !== oldToken);
        student.sessions.push({ token: newToken });
        await student.save();
        
        res.json({ success: true, token: newToken });
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
});

// Admin Routes
app.get('/api/question-sets', auth, async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        const sets = quizzes.map((quiz, index) => ({
            setId: quiz.setId,
            name: quiz.name,
            title: quiz.title,
            questions: quiz.questions,
            _id: quiz._id
        }));
        res.json(sets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/question-sets/:number', async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        const index = parseInt(req.params.number) - 1;
        
        if (index >= 0 && index < quizzes.length) {
            const quiz = quizzes[index];
            quiz.title = req.body.title;
            quiz.questions = req.body.questions;
            await quiz.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Question set not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/students', async (req, res) => {
    try {
        const students = await Student.find().select('name nickname results');
        const formattedStudents = students.map(student => ({
            name: student.name,
            nickname: student.nickname,
            completedSets: student.results.length,
            averageScore: student.results.length > 0 
                ? Math.round(student.results.reduce((acc, r) => acc + (r.score / r.totalQuestions * 100), 0) / student.results.length)
                : 0
        }));
        res.json(formattedStudents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/question-sets', async (req, res) => {
    try {
        const quiz = new Quiz(req.body);
        await quiz.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/question-sets/:number', async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        const index = parseInt(req.params.number) - 1;
        if (index >= 0 && index < quizzes.length) {
            await Quiz.findByIdAndDelete(quizzes[index]._id);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Question set not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add this new route before the server.listen line
app.get('/api/questions', async (req, res) => {
    try {
        const setNumber = parseInt(req.query.set) - 1;  // Convert to 0-based index
        const quizzes = await Quiz.find();
        
        if (setNumber >= 0 && setNumber < quizzes.length) {
            const quiz = quizzes[setNumber];
            res.json({
                title: quiz.title,
                questions: quiz.questions.map((q, index) => ({
                    id: index,
                    text: q.text,
                    options: q.options.map((opt, i) => ({ id: i, text: opt })),
                    correctAnswer: q.correctAnswer,
                    topic: q.topic,
                    explanation: q.explanation
                }))
            });
        } else {
            res.status(404).json({ error: 'Question set not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add this debug endpoint before the server.listen line
app.get('/api/debug/list-sets', async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        res.json(quizzes.map(quiz => ({
            setId: quiz.setId,
            name: quiz.name,
            title: quiz.title,
            questionCount: quiz.questions.length
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add this new endpoint for getting student results
app.get('/api/student/results', auth, async (req, res) => {
    try {
        const student = await Student.findById(req.student._id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Return all quiz results for the student
        res.json(student.results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 