const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    settings: {
        floors: Number,
        width: Number,
        length: Number,
        location: String,
        shadowing: String,
        ventilation: String,
        hasBalconies: Boolean
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Building', buildingSchema); 