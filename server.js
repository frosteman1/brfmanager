const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
console.log('Attempting to connect to MongoDB...'); // Debug log

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
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

// Error handling
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Routes
app.use('/api/auth', require('./backend/routes/auth.js'));
app.use('/api/buildings', require('./backend/routes/buildings.js'));
app.use('/api/maintenance', require('./backend/routes/maintenance.js'));

console.log('Server has started and should be running...');

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
