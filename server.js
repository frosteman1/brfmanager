const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://www.brfmanager.com'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

let server;

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

    // Serve index.html for all other routes (SPA support)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    });

    // Start server
    const PORT = process.env.PORT || 8080;
    server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Server URL: ${process.env.NODE_ENV === 'production' ? 'https://www.brfmanager.com' : 'http://localhost:' + PORT}`);
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Handle process signals
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    if (server) {
        server.close(() => {
            console.log('HTTP server closed');
            mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });
    } else {
        process.exit(0);
    }
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Performing graceful shutdown...');
    if (server) {
        server.close(() => {
            console.log('HTTP server closed');
            mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });
    } else {
        process.exit(0);
    }
});

// Keep the process alive
process.stdin.resume();

// Log any unhandled errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (server) {
        server.close(() => {
            console.log('HTTP server closed due to uncaught exception');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});
