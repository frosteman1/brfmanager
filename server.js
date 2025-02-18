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
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

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
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    server.on('error', (err) => {
        console.error('Server error:', err);
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server with retry logic
const startServer = (retries = 5) => {
    const PORT = process.env.PORT || 3000;  // Ändrat från 8080 till 3000 som default
    
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is busy, trying another port...`);
            if (retries > 0) {
                // Try the next port
                process.env.PORT = parseInt(PORT) + 1;
                startServer(retries - 1);
            } else {
                console.error('No available ports found after retries');
                process.exit(1);
            }
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM signal');
        server.close(() => {
            console.log('Server closed');
            mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });
    });
};

// Start the server
startServer();
