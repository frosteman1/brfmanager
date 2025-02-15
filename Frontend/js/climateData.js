// Export the climate data
const CLIMATE_DATA = {
    'Stockholm': {
        degreeDays: 3500,
        solarRadiation: 970,
        averageTemp: 6.6,
        windExposure: 1.0
    },
    'Göteborg': {
        degreeDays: 3200,
        solarRadiation: 990,
        averageTemp: 7.7,
        windExposure: 1.2
    },
    'Malmö': {
        degreeDays: 3000,
        solarRadiation: 1020,
        averageTemp: 8.4,
        windExposure: 1.3
    },
    'Umeå': {
        degreeDays: 4200,
        solarRadiation: 870,
        averageTemp: 3.4,
        windExposure: 0.9
    },
    'Uppsala': {
        degreeDays: 3600,
        solarRadiation: 950,
        averageTemp: 5.8,
        windExposure: 1.0
    },
    'Örebro': {
        degreeDays: 3400,
        solarRadiation: 960,
        averageTemp: 6.3,
        windExposure: 0.9
    },
    'Linköping': {
        degreeDays: 3300,
        solarRadiation: 980,
        averageTemp: 6.8,
        windExposure: 1.0
    },
    'Västerås': {
        degreeDays: 3450,
        solarRadiation: 965,
        averageTemp: 6.2,
        windExposure: 1.1
    },
    'Norrköping': {
        degreeDays: 3350,
        solarRadiation: 975,
        averageTemp: 6.7,
        windExposure: 1.1
    },
    'Luleå': {
        degreeDays: 4500,
        solarRadiation: 850,
        averageTemp: 2.4,
        windExposure: 1.0
    }
};

// Climate data helper functions
function getClimateData(location) {
    return CLIMATE_DATA[location] || CLIMATE_DATA['Stockholm'];
}

// Make the functions and data available globally
window.CLIMATE_DATA = CLIMATE_DATA;
window.getClimateData = getClimateData; 