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
        
        console.log('Request body:', req.body);
        console.log('User ID from auth:', req.user.userId);
        
        if (!maintenanceItems || !Array.isArray(maintenanceItems)) {
            return res.status(400).json({ 
                message: 'Invalid data format',
                details: 'maintenanceItems must be an array'
            });
        }

        console.log('Received items to save:', maintenanceItems);

        // Validera varje item innan vi försöker spara
        for (const item of maintenanceItems) {
            if (!item.category || !item.description || !item.plannedYear) {
                return res.status(400).json({
                    message: 'Invalid item data',
                    details: `Missing required fields in item: ${JSON.stringify(item)}`
                });
            }
        }

        try {
            // Delete existing items for this user
            const deleteResult = await MaintenanceItem.deleteMany({ userId: req.user.userId });
            console.log('Delete result:', deleteResult);
            
            if (maintenanceItems.length === 0) {
                return res.json({ 
                    message: 'All items deleted successfully',
                    items: []
                });
            }

            // Add userId to each item and ensure all required fields
            const itemsWithUserId = maintenanceItems.map(item => ({
                category: item.category,
                description: item.description,
                cost: parseInt(item.cost) || 0,
                plannedYear: parseInt(item.plannedYear),
                priority: item.priority || 'Normal',
                status: item.status || 'Planerad',
                interval: parseInt(item.interval) || 30,
                name: item.name || item.description,
                date: item.date || new Date().toISOString().split('T')[0],
                userId: req.user.userId
            }));
            
            console.log('Prepared items for saving:', itemsWithUserId);

            // Save new items
            const savedItems = await MaintenanceItem.insertMany(itemsWithUserId);
            console.log(`Successfully saved ${savedItems.length} items`);
            
            res.json({ 
                message: 'Maintenance items saved successfully',
                items: savedItems
            });
        } catch (dbError) {
            console.error('Database operation error:', dbError);
            throw new Error(`Database error: ${dbError.message}`);
        }
    } catch (error) {
        console.error('Error in /save endpoint:', error);
        console.error('Full error object:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
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