const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Start server first
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
});

// Then connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB');
        
        // Routes (only add after DB connection)
        const authRoutes = require('./backend/routes/auth');
        app.use('/api/auth', authRoutes);
        
        // Add other routes here as needed
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Don't exit process, let server continue running
    });

// Basic routes
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        mongo: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

app.get('/', (req, res) => {
    res.status(200).send('Server is running');
});

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();  // No content response for favicon
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('Server and MongoDB connections closed');
            process.exit(0);
        });
    });
});

// Keep timeouts high
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Keep process alive
process.stdin.resume();
