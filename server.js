const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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
        
        // Routes
        const authRoutes = require('./backend/routes/auth');
        app.use('/api/auth', authRoutes);
        
        const maintenanceRoutes = require('./backend/routes/maintenance');
        app.use('/api/maintenance', maintenanceRoutes);
        
        // Add other routes here as needed
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// API routes
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        mongo: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
