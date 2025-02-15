let energyChart;

// Energy calculation constants
const ENERGY_CONSTANTS = {
    windowUValue: 2.8,
    wallUValue: 0.4,
    roofUValue: 0.3,
    floorUValue: 0.3,
    ventilationLoss: 0.35,
    heatRecovery: 0.5,
    internalGains: 4,
    solarGainFactor: 0.5
};

// Energy calculation functions
function calculateEnergyConsumption(settings) {
    const climateData = getClimateData(settings.location);
    
    // Calculate transmission losses
    const windowArea = calculateWindowArea(settings);
    const wallArea = calculateWallArea(settings) - windowArea;
    const roofArea = settings.width * settings.length;
    const floorArea = settings.width * settings.length;
    
    const transmissionLoss = (
        windowArea * ENERGY_CONSTANTS.windowUValue +
        wallArea * ENERGY_CONSTANTS.wallUValue +
        roofArea * ENERGY_CONSTANTS.roofUValue +
        floorArea * ENERGY_CONSTANTS.floorUValue
    ) * climateData.degreeDays * 24;

    // Calculate ventilation losses
    const volume = settings.width * settings.length * settings.floors * 3; // 3m ceiling height
    const ventilationLoss = volume * ENERGY_CONSTANTS.ventilationLoss * (1 - ENERGY_CONSTANTS.heatRecovery) * climateData.degreeDays * 24;

    // Calculate gains
    const internalGains = ENERGY_CONSTANTS.internalGains * floorArea * 365 * 24;
    const solarGains = windowArea * ENERGY_CONSTANTS.solarGainFactor * climateData.solarRadiation;

    // Total energy need
    const totalEnergy = Math.max(0, transmissionLoss + ventilationLoss - internalGains - solarGains);
    
    return {
        transmission: transmissionLoss,
        ventilation: ventilationLoss,
        internal: internalGains,
        solar: solarGains,
        total: totalEnergy
    };
}

function calculateWindowArea(settings) {
    return settings.width * settings.floors * 3 * 0.2; // Assume 20% window area
}

function calculateWallArea(settings) {
    return 2 * (settings.width + settings.length) * settings.floors * 3;
}

function initEnergyChart() {
    const ctx = document.getElementById('energyChart').getContext('2d');
    energyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Transmission', 'Ventilation', 'Interna vinster', 'Solvinster', 'Total'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'kWh/år'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateEnergyDisplay() {
    const settings = getBuildingSettings();
    const energyData = calculateEnergyConsumption(settings);
    
    // Update chart if it exists
    if (energyChart) {
        energyChart.data.datasets[0].data = [
            energyData.transmission / 1000,
            energyData.ventilation / 1000,
            -energyData.internal / 1000,
            -energyData.solar / 1000,
            energyData.total / 1000
        ];
        energyChart.update();
    }

    // Update text display with null checks
    const totalEnergyElement = document.getElementById('totalEnergy');
    const energyPerSquareMeterElement = document.getElementById('energyPerSquareMeter');
    
    if (totalEnergyElement) {
        totalEnergyElement.textContent = Math.round(energyData.total / 1000) + ' kWh/år';
    }
    
    if (energyPerSquareMeterElement) {
        energyPerSquareMeterElement.textContent = 
            Math.round(energyData.total / (settings.width * settings.length * settings.floors)) + ' kWh/m²/år';
    }
}

// Make functions globally available
window.calculateEnergyConsumption = calculateEnergyConsumption;
window.initEnergyChart = initEnergyChart;
window.updateEnergyDisplay = updateEnergyDisplay;
window.energyChart = energyChart; 