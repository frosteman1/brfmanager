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
        
        // Validera inkommande data
        if (!maintenanceItems || !Array.isArray(maintenanceItems)) {
            console.error('Invalid maintenance items format:', maintenanceItems);
            return res.status(400).json({ message: 'Invalid maintenance items format' });
        }

        console.log('Received maintenance items:', maintenanceItems);
        console.log('User ID:', req.user.userId);
        
        // Delete existing items for this user
        const deleteResult = await MaintenanceItem.deleteMany({ userId: req.user.userId });
        console.log('Deleted existing items:', deleteResult);
        
        // Add userId and validate each item
        const itemsWithUserId = maintenanceItems.map(item => {
            // Validera required fält
            if (!item.category || !item.description || !item.cost || !item.plannedYear || !item.priority) {
                throw new Error('Missing required fields in maintenance item');
            }

            return {
                ...item,
                userId: req.user.userId,
                // Säkerställ att alla required fält finns och har rätt format
                cost: parseInt(item.cost),
                plannedYear: parseInt(item.plannedYear),
                interval: parseInt(item.interval) || 30,
                name: item.name || item.description,
                date: item.date || new Date().toISOString().split('T')[0],
                status: item.status || 'Planerad'
            };
        });
        
        console.log('Prepared items for saving:', itemsWithUserId);
        
        // Save new items
        const savedItems = await MaintenanceItem.insertMany(itemsWithUserId);
        console.log('Successfully saved items:', savedItems.length);
        
        res.json({ 
            message: 'Maintenance items saved successfully',
            items: savedItems 
        });
    } catch (error) {
        console.error('Error saving maintenance items:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Skicka mer detaljerat felmeddelande
        res.status(500).json({ 
            message: 'Failed to save maintenance items',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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