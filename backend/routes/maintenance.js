const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MaintenanceItem = require('../models/maintenanceitem');

// GET maintenance items
router.get('/', auth, async (req, res) => {
    try {
        const items = await MaintenanceItem.find({ userId: req.user.userId });
        res.json(items);
    } catch (error) {
        console.error('Error fetching maintenance items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Save maintenance items
router.post('/save', auth, async (req, res) => {
    try {
        const { maintenanceItems } = req.body;
        
        // Delete existing items for this user
        await MaintenanceItem.deleteMany({ userId: req.user.userId });
        
        // Add userId to each item
        const itemsWithUserId = maintenanceItems.map(item => ({
            ...item,
            userId: req.user.userId
        }));
        
        // Save new items
        await MaintenanceItem.insertMany(itemsWithUserId);
        
        res.json({ message: 'Maintenance items saved successfully' });
    } catch (error) {
        console.error('Error saving maintenance items:', error);
        res.status(500).json({ message: 'Failed to save maintenance items' });
    }
});

// Load maintenance items
router.get('/load', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const maintenanceItems = await MaintenanceItem.find({ userId })
            .select('-userId')
            .sort('plannedYear');
            
        res.json({ maintenanceItems });
    } catch (error) {
        console.error('Error loading maintenance items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 