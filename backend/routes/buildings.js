const router = require('express').Router();
const auth = require('../middleware/auth');
const Building = require('../models/building');

// Get all buildings for a user
router.get('/', auth, async (req, res) => {
    try {
        const buildings = await Building.find({ user: req.user.userId });
        res.json(buildings);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific building
router.get('/:id', auth, async (req, res) => {
    try {
        const building = await Building.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        res.json(building);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new building
router.post('/', auth, async (req, res) => {
    try {
        const { name, settings } = req.body;

        const building = new Building({
            user: req.user.userId,
            name,
            settings
        });

        await building.save();
        res.json(building);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a building
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, settings } = req.body;

        // Find and update building
        let building = await Building.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        building.name = name || building.name;
        building.settings = settings || building.settings;
        building.lastModified = Date.now();

        await building.save();
        res.json(building);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a building
router.delete('/:id', auth, async (req, res) => {
    try {
        const building = await Building.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        await building.remove();
        res.json({ message: 'Building removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Batch update buildings (for multiple buildings)
router.post('/batch', auth, async (req, res) => {
    try {
        const { buildings } = req.body;
        const updates = [];

        for (let building of buildings) {
            const update = await Building.findOneAndUpdate(
                { _id: building._id, user: req.user.userId },
                { 
                    $set: {
                        name: building.name,
                        settings: building.settings,
                        lastModified: Date.now()
                    }
                },
                { new: true }
            );
            if (update) updates.push(update);
        }

        res.json(updates);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 