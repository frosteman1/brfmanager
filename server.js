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

// MongoDB connection with more options
mongoose.connect(process.env.MONGODB_URI, {
    retryWrites: true,
    w: 'majority',
    dbName: 'brfmanager'  // Lägg till namnet på din databas här
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
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

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
