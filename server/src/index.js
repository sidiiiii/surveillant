const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


const path = require('path');

// CORS Configuration for Production
// Smart CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost for development
        if (origin.includes('localhost')) return callback(null, true);

        // Allow any Vercel deployment
        if (origin.endsWith('.vercel.app')) return callback(null, true);

        // Allow the specific FRONTEND_URL if set
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }

        // Block others by default (or allow if you want to be very permissive: callback(null, true))
        console.log('CORS Blocked:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.get('/logo.jpeg', (req, res) => res.sendFile(path.resolve(__dirname, '../../Surveilleur.jpeg')));

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

app.get('/', (req, res) => {
    res.send('School Tracking Platform API');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
