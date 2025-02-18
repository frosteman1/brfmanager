const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Process error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    // Stäng MongoDB-anslutningen och servern ordentligt
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// MongoDB connection
console.log('Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGODB_URI, {
    w: 'majority'
})
.then(() => {
    console.log('Successfully connected to MongoDB');
    console.log('Database name:', mongoose.connection.name);
    
    // Routes
    const authRoutes = require('./backend/routes/auth');
    const maintenanceRoutes = require('./backend/routes/maintenance');

    app.use('/api/auth', authRoutes);
    app.use('/api/maintenance', maintenanceRoutes);

    // Serve static files for any other route
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Start server only after DB connection
    const PORT = process.env.PORT || 8080;
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    server.on('error', (err) => {
        console.error('Server error:', err);
    });
})
.catch(err => {
    console.error('MongoDB connection error details:', {
        message: err.message,
        code: err.code,
        codeName: err.codeName
    });
    process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
