const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

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
})
.catch(err => {
    console.error('MongoDB connection error details:', {
        message: err.message,
        code: err.code,
        codeName: err.codeName
    });
    process.exit(1);
});

// Routes
const authRoutes = require('./backend/routes/auth');
const maintenanceRoutes = require('./backend/routes/maintenance');

app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Serve static files for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
