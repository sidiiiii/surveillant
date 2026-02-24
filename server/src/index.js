const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Smart CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.includes('localhost')) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        if (origin.includes('surveillant.it.com')) return callback(null, true);
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }
        console.log('CORS Blocked:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/students', require('./routes/documents'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/public', require('./routes/public'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/analysis', require('./routes/analysis'));

// Serve built React frontend in production
const frontendBuildPath = path.join(process.cwd(), 'public');
if (IS_PRODUCTION && fs.existsSync(frontendBuildPath)) {
    app.use(express.static(frontendBuildPath));
    // Catch-all: serve index.html for React Router
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('School Tracking Platform API - Running in development mode');
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (${IS_PRODUCTION ? 'production' : 'development'})`);
});
