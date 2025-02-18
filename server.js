const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Immediate response for health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Quick response for root path
app.get('/', (req, res) => {
    res.status(200).send('Server is running');
});

// MongoDB connection
console.log('Attempting to connect to MongoDB...');

// Start server before MongoDB connection
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});

// Then connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    w: 'majority'
})
.then(() => {
    console.log('Successfully connected to MongoDB');
    
    // Routes
    const authRoutes = require('./backend/routes/auth');
    const maintenanceRoutes = require('./backend/routes/maintenance');

    app.use('/api/auth', authRoutes);
    app.use('/api/maintenance', maintenanceRoutes);

    // Serve index.html for client-side routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    // Don't exit process on MongoDB connection error
    console.log('Server will continue running without MongoDB connection');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Keep the process alive
process.stdin.resume();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('Process terminated');
            process.exit(0);
        });
    });
});
