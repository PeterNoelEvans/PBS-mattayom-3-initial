const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const auth = async (req, res, next) => {
    try {
        console.log('Auth middleware - checking token');
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Token received:', token ? 'Token exists' : 'No token');
        
        if (!token) {
            throw new Error('No token provided');
        }

        console.log('Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        console.log('Finding student...');
        const student = await Student.findOne({ 
            _id: decoded.studentId,
            'sessions.token': token
        });
        console.log('Student found:', student ? 'Yes' : 'No');

        if (!student) {
            throw new Error('Student not found');
        }

        req.token = token;
        req.student = student;
        console.log('Auth successful');
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({ error: 'Please authenticate' });
    }
};

module.exports = auth; 