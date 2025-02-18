const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { email, password, companyName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Användare med denna email finns redan' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            email,
            password: hashedPassword,
            companyName
        });

        await user.save();

        res.status(201).json({ message: 'Användare skapad!' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Serverfel vid registrering' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Felaktig email eller lösenord' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Felaktig email eller lösenord' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                companyName: user.companyName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Serverfel vid inloggning' });
    }
});

// Temporär route för att lista användare (ta bort i produktion!)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, { email: 1, _id: 1 }); // Exkludera lösenord
        console.log('Found users:', users);
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 