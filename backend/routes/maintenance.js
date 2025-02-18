const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.js');
const MaintenanceItem = require('../models/maintenanceitem.js');

// Save maintenance items
router.post('/save', auth, async (req, res) => {
    try {
        const { maintenanceItems } = req.body;
        const userId = req.user.userId;

        // Log for debugging
        console.log('Saving items:', maintenanceItems);
        console.log('User ID:', userId);

        // Delete existing items for this user
        await MaintenanceItem.deleteMany({ userId });

        // Save new items with userId
        const items = maintenanceItems.map(item => ({
            ...item,
            userId
        }));
        await MaintenanceItem.insertMany(items);

        res.json({ message: 'Maintenance items saved successfully' });
    } catch (error) {
        console.error('Error saving maintenance items:', error);
        res.status(500).json({ message: error.message });
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