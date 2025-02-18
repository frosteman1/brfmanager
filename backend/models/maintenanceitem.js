const mongoose = require('mongoose');

const MaintenanceItemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    plannedYear: {
        type: Number,
        required: true
    },
    priority: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Planerad'
    },
    interval: {
        type: Number,
        default: 30
    },
    projectId: String,
    energySaving: Boolean,
    location: String,
    building: String,
    actualCost: Number,
    name: {
        type: String,
    },
    date: {
        type: String,
    }
});

module.exports = mongoose.model('MaintenanceItem', MaintenanceItemSchema); 