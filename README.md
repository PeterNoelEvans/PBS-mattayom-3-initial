# English Assessment Platform

A web-based assessment platform for Mattayom 3 English, featuring interactive quizzes, progress tracking, and personalized feedback.

## Features

- **Student Authentication**: Secure login system with nickname-based authentication
- **Interactive Quizzes**: Multiple sets of questions covering various English topics
- **Progress Tracking**: Track student performance across different question sets
- **Real-time Feedback**: Immediate feedback on quiz performance
- **Student Dashboard**: Visual representation of progress and achievements
- **Admin Panel**: Manage question sets and monitor student progress

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Development**: Nodemon for hot-reloading

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/PeterNoelEvans/PBS-Mattayom3.git
cd m3project-book
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
Create a `.env` file in the root directory with:
```env
MONGODB_URI=mongodb://localhost:27017/m3project-book
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=development
```

4. Initialize the database:
```bash
node scripts/initDb.js
```

5. Start the application:
```bash
# Development mode with hot-reloading
npm run dev

# Production mode
npm start
```

## Project Structure
```
m3project-book/
├── models/          # MongoDB models
├── middleware/      # Express middleware
├── public/         # Static files and frontend
├── scripts/        # Database scripts
├── server.js       # Main application file
└── README.md       # Documentation
```

## Usage

1. **Student Access**:
   - Navigate to `http://localhost:3000`
   - Register with a nickname or log in if returning
   - Access quizzes from the dashboard
   - View progress and performance statistics

2. **Admin Access**:
   - Navigate to `http://localhost:3000/admin-login.html`
   - Use admin credentials to log in
   - Manage question sets and view student progress

## Development

To run the application in development mode with hot reloading:
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Peter Noel Evans

## Acknowledgments

- PBS School for the opportunity to develop this platform
- All contributing teachers and students for their feedback
