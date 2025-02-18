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

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brfmanager';
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.use('/api/auth', require('./backend/routes/auth.js'));
app.use('/api/buildings', require('./backend/routes/buildings.js'));
app.use('/api/maintenance', require('./backend/routes/maintenance.js'));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
