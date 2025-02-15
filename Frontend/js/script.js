// ============= GLOBAL VARIABLES =============
let scene, camera, renderer, building, controls;
let buildings = [];

// ============= INITIALIZATION =============
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 15, 30);
    camera.lookAt(0, 7, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(document.getElementById('building-canvas').offsetWidth, 500);
    document.getElementById('building-canvas').appendChild(renderer.domElement);

    // Initialize controls
    setupControls();

    // Add lights
    setupLights();

    // Add environment
    addEnvironment();

    // Load saved settings before initial building creation
    loadBuildingSettings();
    
    // If no saved settings exist, createBuilding will use defaults
    if (!localStorage.getItem('buildingSettings')) {
        createBuilding();
    }
    
    // Update energy display
    updateEnergyDisplay();
    
    // Setup event listeners after initialization
    setupEventListeners();

    // Start animation loop
    animate();
}

// ============= CONTROLS SETUP =============
function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 20;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minPolarAngle = 0;
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.target.set(0, 7, 0);
}

// ============= LIGHTING SETUP =============
function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight1.position.set(10, 20, 10);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-10, 15, -10);
    scene.add(directionalLight2);
}

// ============= ANIMATION =============
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function createRoof(width, length, roofType, roofAngle) {
    const roofGroup = new THREE.Group();
    
    // Materials
    const roofMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3B2417,  // Dark brown for tiles
        shininess: 10
    });
    
    const gutterMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444,  // Dark grey for gutters
        shininess: 30
    });

    const overhangWidth = 0.5;  // 0.5m overhang on each side
    const actualWidth = width + (overhangWidth * 2);
    const actualLength = length + (overhangWidth * 2);

    let roofMesh;

    switch (roofType) {
        case 'flat':
            const flatGeometry = new THREE.BoxGeometry(actualWidth, 0.3, actualLength);
            roofMesh = new THREE.Mesh(flatGeometry, roofMaterial);
            
            // Add parapet walls
            const parapetMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
            const parapetHeight = 0.5;
            
            // Create parapet walls on all sides
            const sides = [
                { width: actualWidth, length: 0.2, x: 0, z: actualLength/2 },
                { width: actualWidth, length: 0.2, x: 0, z: -actualLength/2 },
                { width: 0.2, length: actualLength, x: actualWidth/2, z: 0 },
                { width: 0.2, length: actualLength, x: -actualWidth/2, z: 0 }
            ];

            sides.forEach(side => {
                const parapetGeometry = new THREE.BoxGeometry(side.width, parapetHeight, side.length);
                const parapet = new THREE.Mesh(parapetGeometry, parapetMaterial);
                parapet.position.set(side.x, parapetHeight/2, side.z);
                roofGroup.add(parapet);
            });
            break;

        case 'pitched':
            const height = Math.tan((roofAngle * Math.PI) / 180) * (actualWidth / 2);
            
            // Create main roof shape with overhang
            const pitchedShape = new THREE.Shape();
            pitchedShape.moveTo(-actualWidth/2, 0);
            pitchedShape.lineTo(0, height);
            pitchedShape.lineTo(actualWidth/2, 0);
            pitchedShape.lineTo(-actualWidth/2, 0);

            const extrudeSettings = {
                steps: 1,
                depth: actualLength,
                bevelEnabled: true,
                bevelThickness: 0.1,
                bevelSize: 0.1,
                bevelSegments: 3
            };

            const pitchedGeometry = new THREE.ExtrudeGeometry(pitchedShape, extrudeSettings);
            roofMesh = new THREE.Mesh(pitchedGeometry, roofMaterial);
            roofMesh.position.z = -actualLength/2;

            // Add gutters
            const gutterRadius = 0.1;
            const gutterGeometry = new THREE.CylinderGeometry(gutterRadius, gutterRadius, actualLength, 8, 1, true, Math.PI, Math.PI);
            const leftGutter = new THREE.Mesh(gutterGeometry, gutterMaterial);
            const rightGutter = new THREE.Mesh(gutterGeometry, gutterMaterial);

            leftGutter.rotation.z = Math.PI/2;
            rightGutter.rotation.z = Math.PI/2;
            leftGutter.position.set(-actualWidth/2, 0, 0);
            rightGutter.position.set(actualWidth/2, 0, 0);

            roofGroup.add(leftGutter);
            roofGroup.add(rightGutter);
            break;

        default:
            // Default to flat roof
            const defaultGeometry = new THREE.BoxGeometry(actualWidth, 0.3, actualLength);
            roofMesh = new THREE.Mesh(defaultGeometry, roofMaterial);
            break;
    }

    if (roofMesh) {
        roofGroup.add(roofMesh);
    }

    return roofGroup;
}

function createBuilding() {
    if (building) {
        while(building.children.length > 0) { 
            building.remove(building.children[0]); 
        }
        scene.remove(building);
    }
    
    building = new THREE.Group();
    
    // Get values from form with null checks
    const floors = parseInt(document.getElementById('floors')?.value) || 3;
    const width = parseInt(document.getElementById('width')?.value) || 20;
    const length = parseInt(document.getElementById('length')?.value) || 30;
    const floorHeight = parseInt(document.getElementById('floorHeight')?.value) || 3;
    const color = new THREE.Color(document.getElementById('buildingColor')?.value || '#cccccc');
    const apartmentsPerFloor = parseInt(document.getElementById('apartmentsPerFloor')?.value) || 2;
    const windowsPerApartment = parseInt(document.getElementById('windowsPerApartment')?.value) || 3;
    const balconyDepth = parseFloat(document.getElementById('balconyDepth')?.value) || 1.5;
    const hasBalconies = document.getElementById('hasBalconies')?.checked ?? true; // Default to true if element doesn't exist
    const roofType = document.getElementById('roofType')?.value || 'flat';
    const roofAngle = parseInt(document.getElementById('roofAngle')?.value) || 30;

    // Create each floor
    for (let i = 0; i < floors; i++) {
        // Main floor structure
        const floorGeometry = new THREE.BoxGeometry(width, floorHeight, length);
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: false,
            opacity: 1.0
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = (i * floorHeight) + (floorHeight/2);
        building.add(floor);

        // Add windows
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.8
        });

        const apartmentWidth = width / apartmentsPerFloor;
        
        for (let a = 0; a < apartmentsPerFloor; a++) {
            for (let w = 0; w < windowsPerApartment; w++) {
                const windowGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.2);
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                
                // Window frame
                const frameGeometry = new THREE.BoxGeometry(1.4, 2, 0.1);
                const frameMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xffffff
                });
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                
                window.position.x = (a * apartmentWidth) - (width/2) + (apartmentWidth/(windowsPerApartment+1)) * (w+1);
                window.position.y = (i * floorHeight) + (floorHeight/2);
                window.position.z = length/2 + 0.1;
                frame.position.copy(window.position);
                frame.position.z -= 0.1;
                
                building.add(window);
                building.add(frame);
            }

            // Only add balconies if hasBalconies is true
            if (hasBalconies && balconyDepth > 0) {
                // Add balcony
                const balconyGeometry = new THREE.BoxGeometry(apartmentWidth * 0.8, 0.2, balconyDepth);
                const balconyMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
                const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
                balcony.position.x = (a * apartmentWidth) - (width/2) + apartmentWidth/2;
                balcony.position.y = (i * floorHeight) + 0.1;
                balcony.position.z = length/2 + balconyDepth/2;
                building.add(balcony);

                // Add balcony railing
                const railingMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
                
                // Vertical posts
                for (let p = 0; p <= 4; p++) {
                    const post = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.03, 0.03, 1, 8),
                        railingMaterial
                    );
                    post.position.copy(balcony.position);
                    post.position.y += 0.5;
                    post.position.x += (apartmentWidth * 0.4) - (p * apartmentWidth * 0.2);
                    building.add(post);
                }

                // Horizontal rails
                const topRail = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.04, apartmentWidth * 0.8, 8),
                    railingMaterial
                );
                topRail.rotation.z = Math.PI / 2;
                topRail.position.copy(balcony.position);
                topRail.position.y += 1;
                building.add(topRail);
            }
        }
    }

    // Add roof
    const roof = createRoof(width, length, roofType, roofAngle);
    roof.position.y = floors * floorHeight;
    building.add(roof);

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2d5a27,  // Changed to a grass green color
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Position building
    building.position.y = 0;
    scene.add(building);

    // Update information display
    document.getElementById('floorDisplay').textContent = floors;
    document.getElementById('apartmentDisplay').textContent = floors * apartmentsPerFloor;
    document.getElementById('dimensionsDisplay').textContent = `${width}m × ${length}m`;
}

// ============= EVENT LISTENERS =============
document.addEventListener('DOMContentLoaded', () => {
    init();
    initEnergyChart();
    updateEnergyDisplay();
    setupPDFUpload();
});

function updateEnergyChart(interval) {
    // Get the selected interval
    const selectedInterval = interval || document.querySelector('input[name="interval"]:checked').value;
    
    // Get the chart instance
    const chart = Chart.getChart("energyChart");
    if (!chart) {
        console.error('Chart not found');
        return;
    }

    // Update the data based on interval
    let data;
    switch(selectedInterval) {
        case 'week':
            data = generateWeeklyData();
            break;
        case 'month':
            data = generateMonthlyData();
            break;
        case 'year':
            data = generateYearlyData();
            break;
        default:
            data = generateWeeklyData();
    }

    // Update chart data
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.values;
    
    // Update chart
    chart.update();
}

// Add event listeners for interval changes
document.querySelectorAll('input[name="interval"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        updateEnergyChart(e.target.value);
    });
});

// Helper functions to generate data
function generateWeeklyData() {
    // Generate weekly data
    return {
        labels: ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'],
        values: [65, 59, 80, 81, 56, 55, 40]
    };
}

function generateMonthlyData() {
    // Generate monthly data
    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
        values: [65, 59, 80, 81, 56, 55, 40, 45, 58, 62, 60, 65]
    };
}

function generateYearlyData() {
    // Generate yearly data
    const currentYear = new Date().getFullYear();
    return {
        labels: Array.from({length: 5}, (_, i) => (currentYear - 4 + i).toString()),
        values: [540, 580, 620, 590, 610]
    };
}

function setupEventListeners() {
    const inputs = [
        'buildingColor',
        'floors',
        'width',
        'length',
        'floorHeight',
        'apartmentsPerFloor',
        'windowsPerApartment',
        'balconyDepth',
        'roofType',
        'roofAngle',
        'wallMaterial',
        'wallInsulation',
        'wallInsulationThickness',
        'windowType',
        'roofInsulationThickness',
        'floorInsulationThickness',
        'heatingSystem',
        'heatPumpType',
        'coolingSystem',
        'ventilationType',
        'waterHeating',
        'buildingLocation', // Make sure this is included
        'constructionYear',
        'lastRenovation',
        'buildingOrientation',
        'shading',
        'smartControls',
        'heatingLastService',
        'heatingNextService',
        'ventilationLastService',
        'ventilationNextService'
    ];

    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            ['input', 'change'].forEach(eventType => {
                element.addEventListener(eventType, () => {
                    console.log(`${id} changed to:`, element.value); // Debug log
                    createBuilding();
                    updateEnergyDisplay();
                    saveBuildingSettings();
                });
            });
        }
    });

    // Add specific handler for location changes
    const locationElement = document.getElementById('buildingLocation');
    if (locationElement) {
        locationElement.addEventListener('change', () => {
            console.log('Location changed to:', locationElement.value);
            const settings = getBuildingSettings();
            console.log('Current settings:', settings);
            updateEnergyDisplay();
            saveBuildingSettings();
        });
    }

    // Handle save button click
    document.getElementById('savePreferences').addEventListener('click', () => {
        createBuilding();
        saveBuildingSettings();
        bootstrap.Modal.getInstance(document.getElementById('buildingPreferences')).hide();
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(document.getElementById('building-canvas').offsetWidth, 500);
});

// Energy consumption chart
function initEnergyChart() {
    const ctx = document.getElementById('energyChart').getContext('2d');

    // Destroy existing chart if it exists
    if (energyChart) {
        energyChart.destroy();
    }

    energyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'Energy Consumption',
                data: [65, 59, 80, 81, 56, 55, 40],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Energy Consumption Over Time'
                }
            }
        }
    });
}

function getBuildingSettings() {
    const settings = {
        floors: parseInt(document.getElementById('floors').value) || 3,
        width: parseInt(document.getElementById('width').value) || 20,
        length: parseInt(document.getElementById('length').value) || 30,
        floorHeight: parseInt(document.getElementById('floorHeight').value) || 3,
        buildingColor: document.getElementById('buildingColor').value,
        apartmentsPerFloor: parseInt(document.getElementById('apartmentsPerFloor').value) || 2,
        windowsPerApartment: parseInt(document.getElementById('windowsPerApartment').value) || 3,
        balconyDepth: parseFloat(document.getElementById('balconyDepth').value) || 1.5,
        roofType: document.getElementById('roofType').value || 'flat',
        roofAngle: parseInt(document.getElementById('roofAngle').value) || 30,
        wallMaterial: document.getElementById('wallMaterial').value,
        wallInsulation: document.getElementById('wallInsulation').value,
        wallInsulationThickness: parseInt(document.getElementById('wallInsulationThickness').value) || 200,
        windowType: document.getElementById('windowType').value,
        roofInsulationThickness: parseInt(document.getElementById('roofInsulationThickness').value) || 400,
        floorInsulationThickness: parseInt(document.getElementById('floorInsulationThickness').value) || 300,
        heatingSystem: document.getElementById('heatingSystem').value,
        heatPumpType: document.getElementById('heatPumpType').value,
        coolingSystem: document.getElementById('coolingSystem').value,
        ventilationType: document.getElementById('ventilationType').value,
        waterHeating: document.getElementById('waterHeating').value,
        buildingLocation: document.getElementById('buildingLocation').value || 'Stockholm', // Add this line
        constructionYear: parseInt(document.getElementById('constructionYear').value),
        lastRenovation: parseInt(document.getElementById('lastRenovation').value),
        buildingOrientation: parseInt(document.getElementById('buildingOrientation').value),
        shading: document.getElementById('shading').value,
        smartControls: Array.from(document.getElementById('smartControls').selectedOptions).map(opt => opt.value),
        maintenance: {
            heating: {
                lastService: document.getElementById('heatingLastService').value,
                nextService: document.getElementById('heatingNextService').value
            },
            ventilation: {
                lastService: document.getElementById('ventilationLastService').value,
                nextService: document.getElementById('ventilationNextService').value
            }
        }
    };
    return settings;
}

function saveBuildingSettings() {
    const settings = getBuildingSettings();
    localStorage.setItem('buildingSettings', JSON.stringify(settings));
}

function loadBuildingSettings() {
    const savedSettings = localStorage.getItem('buildingSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        // Apply saved settings to form
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = settings[key];
            }
        });
        // Rebuild the 3D model with loaded settings
        createBuilding();
    }
}

// Add this new function for energy calculations
function calculateEnergyConsumption(settings) {
    // Get climate data for the location
    const location = settings.buildingLocation || 'Stockholm';
    const climateData = getClimateData(location);
    
    // Calculate base values
    const wallArea = (settings.width * 2 + settings.length * 2) * settings.floorHeight * settings.floors;
    const windowArea = 1.2 * 1.8 * settings.windowsPerApartment * settings.apartmentsPerFloor * settings.floors;
    const roofArea = settings.width * settings.length;
    const floorArea = settings.width * settings.length;

    // Calculate effective U-values
    const wallUValue = calculateWallUValue(settings);
    const windowUValue = getWindowUValue(settings.windowType);
    const roofUValue = 1 / (settings.roofInsulationThickness / 1000 / 0.037 + 0.2);
    const floorUValue = 1 / (settings.floorInsulationThickness / 1000 / 0.037 + 0.2);

    // Calculate losses with climate adjustment
    const transmissionLoss = (
        wallUValue * (wallArea - windowArea) * climateData.windExposure +
        windowUValue * windowArea * climateData.windExposure +
        roofUValue * roofArea +
        floorUValue * floorArea
    ) * climateData.degreeDays * 24 / 1000;

    // Ventilation losses
    let ventilationEfficiency = 1.0;
    switch(settings.ventilationType) {
        case 'ftx':
            ventilationEfficiency = 0.2;
            break;
        case 'mechanical':
            ventilationEfficiency = 0.7;
            break;
        case 'natural':
            ventilationEfficiency = 1.0;
            break;
    }

    const roomVolume = settings.width * settings.length * settings.floorHeight * settings.floors;
    const ventilationLoss = roomVolume * 0.5 * 0.33 * climateData.degreeDays * 24 * ventilationEfficiency / 1000;

    // Solar gains
    let solarFactor = 1.0;
    switch(settings.shading) {
        case 'trees':
            solarFactor = 0.8;
            break;
        case 'buildings':
            solarFactor = 0.7;
            break;
        case 'both':
            solarFactor = 0.6;
            break;
    }

    const orientationFactor = Math.cos((settings.buildingOrientation % 180) * Math.PI / 180) * 0.2 + 0.8;
    const solarGains = windowArea * climateData.solarRadiation * solarFactor * orientationFactor;

    // Calculate total consumption
    const totalAnnual = (transmissionLoss + ventilationLoss - solarGains);
    const heatedArea = settings.width * settings.length * settings.floors;
    const specificConsumption = totalAnnual / heatedArea;

    return {
        totalAnnual: Math.round(totalAnnual),
        specificConsumption: Math.round(specificConsumption),
        transmissionLoss: Math.round(transmissionLoss),
        ventilationLoss: Math.round(ventilationLoss),
        solarGains: Math.round(solarGains),
        details: {
            wallUValue: wallUValue.toFixed(2),
            windowUValue: windowUValue.toFixed(2),
            roofUValue: roofUValue.toFixed(2),
            floorUValue: floorUValue.toFixed(2)
        },
        climateImpact: {
            location,
            degreeDays: climateData.degreeDays,
            solarRadiation: climateData.solarRadiation,
            averageTemp: climateData.averageTemp,
            windExposure: climateData.windExposure
        }
    };
}

// Add U-value constants
const U_VALUES = {
    wall: {
        brick: 0.8,
        concrete: 0.9,
        wood: 0.5
    },
    insulation: {
        mineral: 0.037,
        eps: 0.033,
        cellulose: 0.040
    },
    window: {
        single: 5.0,
        double: 1.3,
        triple: 0.8
    }
};

function calculateWallUValue(settings) {
    // Get base U-value for wall material (with default)
    const baseUValue = U_VALUES.wall[settings.wallMaterial] || 0.8;

    // Get insulation lambda value (with default)
    const insulationLambda = U_VALUES.insulation[settings.wallInsulation] || 0.037;

    // Calculate total U-value with insulation
    const insulationR = (settings.wallInsulationThickness || 200) / 1000 / insulationLambda;
    const totalUValue = 1 / (1/baseUValue + insulationR);

    // Adjust for adjacent buildings if present
    if (settings.shading === 'buildings' || settings.shading === 'both') {
        // Reduce heat loss through walls by 30% if there are adjacent buildings
        return totalUValue * 0.7;
    }

    return totalUValue;
}

function getWindowUValue(windowType) {
    const U_VALUES = {
        single: 5.0,
        double: 1.3,
        triple: 0.8
    };
    return U_VALUES[windowType];
}

function calculateUpgradeRecommendations(currentSettings) {
    const recommendations = [];
    const currentConsumption = calculateEnergyConsumption(currentSettings);
    
    // You can adjust these constants
    const ENERGY_PRICE = 1.5; // SEK per kWh
    const COSTS = {
        window: {
            perWindow: 15000,  // SEK per window
        },
        insulation: {
            perSquareMeter: 800,  // SEK per m² wall area
        },
        ventilation: {
            perApartment: 50000,  // SEK per apartment for FTX
        },
        heatpump: {
            basePrice: 150000,    // Base price for heat pump
            perApartment: 20000,  // Additional cost per apartment
        },
        smartControls: {
            perApartment: 5000,   // Cost per apartment for smart controls
        }
    };

    function isValidRecommendation(annualSavings, upgradeCost) {
        if (annualSavings <= 0) return false; // Filter out negative savings
        const paybackYears = upgradeCost / annualSavings;
        if (!isFinite(paybackYears) || paybackYears <= 0) return false; // Filter out infinite or negative payback
        if (paybackYears > 50) return false; // Optional: filter out very long payback periods
        return true;
    }

    // Window upgrade recommendation
    if (currentSettings.windowType !== 'triple') {
        const upgradeSettings = {...currentSettings, windowType: 'triple'};
        const newConsumption = calculateEnergyConsumption(upgradeSettings);
        const annualSavings = (currentConsumption.totalAnnual - newConsumption.totalAnnual) * ENERGY_PRICE;
        const upgradeCost = COSTS.window.perWindow * 
            (currentSettings.windowsPerApartment * currentSettings.apartmentsPerFloor * currentSettings.floors);
        
        if (isValidRecommendation(annualSavings, upgradeCost)) {
            recommendations.push({
                type: 'window',
                title: 'Uppgradera till 3-glasfönster',
                annualSavings: Math.round(annualSavings),
                upgradeCost: upgradeCost,
                paybackYears: Math.round(upgradeCost / annualSavings),
                co2Reduction: Math.round((currentConsumption.totalAnnual - newConsumption.totalAnnual) * 0.1)
            });
        }
    }

    // Wall insulation upgrade
    if (currentSettings.wallInsulationThickness < 300) {
        const upgradeSettings = {...currentSettings, wallInsulationThickness: 300};
        const newConsumption = calculateEnergyConsumption(upgradeSettings);
        const annualSavings = (currentConsumption.totalAnnual - newConsumption.totalAnnual) * ENERGY_PRICE;
        const wallArea = (currentSettings.width * 2 + currentSettings.length * 2) * 
            currentSettings.floorHeight * currentSettings.floors;
        const upgradeCost = wallArea * COSTS.insulation.perSquareMeter;
        
        if (isValidRecommendation(annualSavings, upgradeCost)) {
            recommendations.push({
                type: 'insulation',
                title: 'Förbättra väggisolering',
                annualSavings: Math.round(annualSavings),
                upgradeCost: Math.round(upgradeCost),
                paybackYears: Math.round(upgradeCost / annualSavings),
                co2Reduction: Math.round((currentConsumption.totalAnnual - newConsumption.totalAnnual) * 0.1)
            });
        }
    }

    // Ventilation system upgrade
    if (currentSettings.ventilationType !== 'ftx') {
        const upgradeSettings = {...currentSettings, ventilationType: 'ftx'};
        const newConsumption = calculateEnergyConsumption(upgradeSettings);
        const annualSavings = (currentConsumption.totalAnnual - newConsumption.totalAnnual) * ENERGY_PRICE;
        const upgradeCost = currentSettings.floors * currentSettings.apartmentsPerFloor * 
            COSTS.ventilation.perApartment;
        
        if (isValidRecommendation(annualSavings, upgradeCost)) {
            recommendations.push({
                type: 'ventilation',
                title: 'Installera FTX-system',
                annualSavings: Math.round(annualSavings),
                upgradeCost: Math.round(upgradeCost),
                paybackYears: Math.round(upgradeCost / annualSavings),
                co2Reduction: Math.round((currentConsumption.totalAnnual - newConsumption.totalAnnual) * 0.1)
            });
        }
    }

    // Heating system upgrade
    if (currentSettings.heatingSystem !== 'heatpump' && currentSettings.heatPumpType !== 'ground') {
        const upgradeSettings = {...currentSettings, heatingSystem: 'heatpump', heatPumpType: 'ground'};
        const newConsumption = calculateEnergyConsumption(upgradeSettings);
        const annualSavings = (currentConsumption.totalAnnual - newConsumption.totalAnnual) * ENERGY_PRICE;
        const upgradeCost = COSTS.heatpump.basePrice + 
            (currentSettings.floors * currentSettings.apartmentsPerFloor * COSTS.heatpump.perApartment);
        
        if (isValidRecommendation(annualSavings, upgradeCost)) {
            recommendations.push({
                type: 'heating',
                title: 'Installera bergvärmepump',
                annualSavings: Math.round(annualSavings),
                upgradeCost: Math.round(upgradeCost),
                paybackYears: Math.round(upgradeCost / annualSavings),
                co2Reduction: Math.round((currentConsumption.totalAnnual - newConsumption.totalAnnual) * 0.1)
            });
        }
    }

    // Smart controls upgrade
    if (!currentSettings.smartControls || currentSettings.smartControls.length < 2) {
        const annualSavings = currentConsumption.totalAnnual * 0.1 * ENERGY_PRICE; // Estimate 10% savings
        const upgradeCost = currentSettings.floors * currentSettings.apartmentsPerFloor * 
            COSTS.smartControls.perApartment;
        
        if (isValidRecommendation(annualSavings, upgradeCost)) {
            recommendations.push({
                type: 'controls',
                title: 'Installera smart styrning',
                annualSavings: Math.round(annualSavings),
                upgradeCost: Math.round(upgradeCost),
                paybackYears: Math.round(upgradeCost / annualSavings),
                co2Reduction: Math.round(currentConsumption.totalAnnual * 0.1 * 0.1)
            });
        }
    }

    return recommendations;
}

// Helper function to format currency with Swedish formatting
function formatCurrency(amount) {
    // Format number with Swedish locale (spaces for thousands, comma for decimals)
    const formatNumber = (num) => {
        return num.toLocaleString('sv-SE', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        });
    };

    if (Math.abs(amount) >= 1000000) {
        return formatNumber(amount / 1000000) + ' Mkr';
    } else if (Math.abs(amount) >= 1000) {
        return formatNumber(amount / 1000) + ' tkr';
    } else {
        return formatNumber(amount) + ' kr';
    }
}

// Update the recommendations display to use the new format
function updateEnergyDisplay() {
    const settings = getBuildingSettings();
    const energyResults = calculateEnergyConsumption(settings);
    const recommendations = calculateUpgradeRecommendations(settings);
    const sustainabilityScore = calculateSustainabilityScore(settings, energyResults);
    
    document.getElementById('energyConsumption').innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Energiberäkning för ${energyResults.climateImpact.location}</h5>
                
                <p><strong>Total årsförbrukning:</strong> ${energyResults.totalAnnual} kWh/år</p>
                <p><strong>Specifik energianvändning:</strong> ${energyResults.specificConsumption} kWh/m²/år</p>
                
                <div class="alert alert-info mt-3">
                    <h6>Klimatpåverkan</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Gradtimmar:</strong> ${energyResults.climateImpact.degreeDays}</p>
                            <p><strong>Solinstrålning:</strong> ${energyResults.climateImpact.solarRadiation} kWh/m²/år</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Medeltemperatur:</strong> ${energyResults.climateImpact.averageTemp}°C</p>
                            <p><strong>Vindexponering:</strong> ${energyResults.climateImpact.windExposure}</p>
                        </div>
                    </div>
                </div>

                <div class="alert alert-secondary mt-3">
                    <h6>Detaljerad information</h6>
                    <p>Transmissionsförluster: ${energyResults.transmissionLoss} kWh/år</p>
                    <p>Ventilationsförluster: ${energyResults.ventilationLoss} kWh/år</p>
                    <p>Solvärmetillskott: ${energyResults.solarGains} kWh/år</p>
                </div>

                <div class="alert alert-light mt-3">
                    <h6>U-värden</h6>
                    <p>Vägg: ${energyResults.details.wallUValue} W/m²K</p>
                    <p>Fönster: ${energyResults.details.windowUValue} W/m²K</p>
                    <p>Tak: ${energyResults.details.roofUValue} W/m²K</p>
                    <p>Golv: ${energyResults.details.floorUValue} W/m²K</p>
                </div>

                <div class="mt-4">
                    <h5>Hållbarhetsbetyg</h5>
                    <div class="progress" style="height: 2rem;">
                        <div class="progress-bar ${getScoreColorClass(sustainabilityScore)}" 
                             role="progressbar" 
                             style="width: ${sustainabilityScore}%">
                            ${sustainabilityScore}/100
                        </div>
                    </div>
                    <div class="mt-2 small text-muted">
                        ${getScoreMessage(sustainabilityScore)}
                    </div>
                </div>

                <h5 class="mt-4">Rekommenderade förbättringar</h5>
                <div class="row">
                    ${recommendations.map(rec => {
                        const roiData = calculateDetailedROI(settings, rec);
                        return `
                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">${rec.title}</h6>
                                        <p class="text-muted small">
                                            ${getUpgradeDescription(rec.type)}
                                        </p>
                                        <div class="row mb-3">
                                            <div class="col-4 text-center">
                                                <div class="h4 mb-0">${roiData.simplePayback} år</div>
                                                <div class="small text-muted">Återbetalningstid</div>
                                            </div>
                                            <div class="col-4 text-center">
                                                <div class="h4 mb-0">${formatCurrency(roiData.netSavings)}</div>
                                                <div class="small text-muted">Besparing</div>
                                            </div>
                                            <div class="col-4 text-center">
                                                <div class="h4 mb-0">${rec.co2Reduction}</div>
                                                <div class="small text-muted">CO2 (kg/år)</div>
                                            </div>
                                        </div>
                                        <button class="btn btn-outline-primary btn-sm w-100" 
                                                onclick="showDetailedAnalysis('${rec.type}')">
                                            Visa detaljerad analys
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function calculateSustainabilityScore(settings, energyResults) {
    let score = 100;
    
    // Window rating
    if (settings.windowType === 'single') score -= 20;
    else if (settings.windowType === 'double') score -= 10;
    
    // Insulation rating
    if (settings.wallInsulationThickness < 200) score -= 15;
    
    // Ventilation rating
    if (settings.ventilationType === 'natural') score -= 15;
    else if (settings.ventilationType === 'mechanical') score -= 5;
    
    // Heating system rating
    if (settings.heatingSystem === 'electric') score -= 20;
    else if (settings.heatingSystem === 'gas') score -= 15;
    
    // Smart controls bonus
    settings.smartControls.forEach(() => score += 2);
    
    // Energy consumption rating
    const specificConsumption = energyResults.specificConsumption;
    if (specificConsumption > 150) score -= 20;
    else if (specificConsumption > 100) score -= 10;
    else if (specificConsumption < 50) score += 10;
    
    return Math.max(0, Math.min(100, score));
}

function getScoreColorClass(score) {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-info';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger';
}

function getScoreMessage(score) {
    if (score >= 80) return 'Utmärkt! Din byggnad är mycket energieffektiv.';
    if (score >= 60) return 'Bra! Det finns några möjligheter till förbättring.';
    if (score >= 40) return 'Det finns betydande potential för energibesparingar.';
    return 'Din byggnad behöver omfattande energieffektiviseringsåtgärder.';
}

// Helper function to get upgrade descriptions
function getUpgradeDescription(type) {
    const descriptions = {
        window: "Uppgradering till energieffektiva fönster minskar värmeförluster och ökar komforten.",
        insulation: "Förbättrad isolering reducerar energiförluster och ger jämnare inomhusklimatet.",
        ventilation: "FTX-system återvinner värme från ventilationsluften och förbättrar inomhusklimatet.",
        heating: "Modern värmepump ger effektiv uppvärmning med lägre driftskostnader.",
        controls: "Smart styrning optimerar energianvändningen efter behov och väder."
    };
    return descriptions[type] || "";
}

// Function to show detailed analysis in a modal
window.showDetailedAnalysis = function(upgradeType) {
    const settings = getBuildingSettings();
    const recommendations = calculateUpgradeRecommendations(settings);
    const upgrade = recommendations.find(r => r.type === upgradeType);
    if (!upgrade) {
        console.error('No upgrade found for type:', upgradeType);
        return;
    }
    
    const roiData = calculateDetailedROI(settings, upgrade);
    const yearlyData = calculateYearlyData(upgrade, 30);
    
    // Define modalHtml before using it
    const modalHtml = `
        <div class="modal fade" id="detailedAnalysisModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detaljerad analys: ${upgrade.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <h6>Investeringsöversikt</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td>Initial investering</td>
                                        <td class="text-end">${formatCurrency(upgrade.upgradeCost)}</td>
                                    </tr>
                                    <tr>
                                        <td>Årlig energibesparing</td>
                                        <td class="text-end">${formatCurrency(upgrade.annualSavings)}</td>
                                    </tr>
                                    <tr>
                                        <td>Underhållskostnad (30 år)</td>
                                        <td class="text-end">${formatCurrency(roiData.totalMaintenanceCost)}</td>
                                    </tr>
                                    <tr>
                                        <td>Utbyteskostnad (30 år)</td>
                                        <td class="text-end">${formatCurrency(roiData.totalReplacementCost)}</td>
                                    </tr>
                                    <tr class="table-success">
                                        <td><strong>Total nettobesparing</strong></td>
                                        <td class="text-end"><strong>${formatCurrency(roiData.netSavings)}</strong></td>
                                    </tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6>Miljöpåverkan</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td>CO2-minskning per år</td>
                                        <td class="text-end">${upgrade.co2Reduction} kg</td>
                                    </tr>
                                    <tr>
                                        <td>CO2-minskning 30 år</td>
                                        <td class="text-end">${upgrade.co2Reduction * 30} kg</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <h6>Kassaflöde över tid</h6>
                            <canvas id="cashflowChart"></canvas>
                        </div>

                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>År</th>
                                        <th>Energibesparing</th>
                                        <th>Underhåll</th>
                                        <th>Utbyte</th>
                                        <th>Netto</th>
                                        <th>Ackumulerat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${yearlyData.map(year => `
                                        <tr>
                                            <td>${year.year}</td>
                                            <td>${Math.round(year.energySavings)} SEK</td>
                                            <td>${Math.round(year.maintenanceCost)} SEK</td>
                                            <td>${Math.round(year.replacementCost)} SEK</td>
                                            <td>${Math.round(year.netCashflow)} SEK</td>
                                            <td>${Math.round(year.accumulated)} SEK</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove any existing modal
    const existingModal = document.getElementById('detailedAnalysisModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add the new modal to the document
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize Bootstrap Modal
    const modalElement = document.getElementById('detailedAnalysisModal');
    const modal = new bootstrap.Modal(modalElement, {
        keyboard: true,
        backdrop: true
    });

    // Wait for modal to be shown before creating chart
    modalElement.addEventListener('shown.bs.modal', function () {
        const ctx = document.getElementById('cashflowChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: yearlyData.map(d => `År ${d.year}`),
                datasets: [{
                    label: 'Ackumulerad besparing',
                    data: yearlyData.map(d => d.accumulated),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Ackumulerad besparing över tid'
                    }
                }
            }
        });
    });

    // Show the modal
    modal.show();
};

// Helper function to calculate yearly data
function calculateYearlyData(upgrade, years) {
    const energyPriceIncrease = 0.04;
    const inflationRate = 0.02;
    const maintenanceCosts = MAINTENANCE_COSTS[upgrade.type] || { yearly: 0, lifetime: 999, replacement: 0 };
    
    let accumulated = -upgrade.upgradeCost;
    return Array.from({ length: years }, (_, i) => {
        const year = i + 1;
        const energySavings = upgrade.annualSavings * Math.pow(1 + energyPriceIncrease, i);
        const maintenanceCost = maintenanceCosts.yearly * Math.pow(1 + inflationRate, i);
        const replacementCost = year % maintenanceCosts.lifetime === 0 ? 
            maintenanceCosts.replacement * Math.pow(1 + inflationRate, i) : 0;
        
        const netCashflow = energySavings - maintenanceCost - replacementCost;
        accumulated += netCashflow;

        return {
            year,
            energySavings,
            maintenanceCost,
            replacementCost,
            netCashflow,
            accumulated
        };
    });
}

// Call init when document is ready
document.addEventListener('DOMContentLoaded', () => {
    initEnergyChart();
    updateEnergyDisplay();
});
// Add these constants at the top with the other constants
const ENERGY_COSTS = {
    electricity: {
        basePrice: 1.5,  // SEK per kWh
        monthlyFee: 200  // SEK per month
    },
    district_heating: {
        basePrice: 0.8,  // SEK per kWh
        monthlyFee: 150  // SEK per month
    },
    gas: {
        basePrice: 1.2,  // SEK per kWh
        monthlyFee: 100  // SEK per month
    }
};

// Add maintenance costs data
const MAINTENANCE_COSTS = {
    window: {
        yearly: 500,     // Annual cleaning and maintenance
        lifetime: 25,    // Expected lifetime in years
        replacement: 15000  // Cost per window
    },
    insulation: {
        yearly: 0,       // Very low maintenance
        lifetime: 40,    // Long lifetime
        replacement: 800 // Cost per m²
    },
    ventilation: {
        yearly: 1500,    // Filter replacement and service
        lifetime: 20,
        replacement: 50000
    },
    heating: {
        yearly: 2000,    // Annual service
        lifetime: 15,
        replacement: 150000
    },
    controls: {
        yearly: 1000,    // Software updates and maintenance
        lifetime: 10,
        replacement: 5000
    }
};

// Update the ROI calculator to include maintenance
function calculateDetailedROI(settings, upgrade) {
    const years = 30;
    const energyPriceIncrease = 0.04;
    const inflationRate = 0.02; // 2% annual inflation
    
    let totalSavings = 0;
    let totalMaintenanceCost = 0;
    let totalReplacementCost = 0;
    
    for (let year = 0; year < years; year++) {
        // Energy savings with price increase
        totalSavings += upgrade.annualSavings * Math.pow(1 + energyPriceIncrease, year);
        
        // Maintenance costs with inflation
        if (MAINTENANCE_COSTS[upgrade.type]) {
            totalMaintenanceCost += MAINTENANCE_COSTS[upgrade.type].yearly * 
                Math.pow(1 + inflationRate, year);
            
            // Add replacement costs when lifetime is reached
            if ((year + 1) % MAINTENANCE_COSTS[upgrade.type].lifetime === 0) {
                totalReplacementCost += MAINTENANCE_COSTS[upgrade.type].replacement * 
                    Math.pow(1 + inflationRate, year);
            }
        }
    }
    
    const totalCosts = upgrade.upgradeCost + totalMaintenanceCost + totalReplacementCost;
    const netSavings = totalSavings - totalCosts;
    
    return {
        totalSavings: Math.round(totalSavings),
        totalMaintenanceCost: Math.round(totalMaintenanceCost),
        totalReplacementCost: Math.round(totalReplacementCost),
        netSavings: Math.round(netSavings),
        simplePayback: Math.round(upgrade.upgradeCost / upgrade.annualSavings),
        roi: Math.round((netSavings) / upgrade.upgradeCost * 100)
    };
}

// Add PDF.js library
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Add the file upload handler
function setupPDFUpload() {
    const fileInput = document.getElementById('energyDeclarationUpload');
    const processButton = document.getElementById('processPDFButton');
    const statusDiv = document.getElementById('pdfStatus');

    processButton.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (file && file.type === 'application/pdf') {
            try {
                // Show loading spinner
                statusDiv.innerHTML = `
                    <div class="alert alert-info d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                        <span>Läser PDF-fil...</span>
                    </div>
                `;

                const text = await extractTextFromPDF(file);
                console.log('Extracted text:', text); // Debug log

                statusDiv.innerHTML = `
                    <div class="alert alert-info">
                        Analyserar innehåll...
                    </div>
                `;

                const data = parseEnergyDeclaration(text);
                console.log('Parsed data:', data);

                // Create a status list and sort by found/not found
                const dataStatus = [
                    { name: 'Primärenergital', key: 'primaryEnergyNumber', value: data.primaryEnergyNumber, unit: 'kWh/m²', formId: 'primaryEnergy' },
                    { name: 'Uppvärmningssystem', key: 'heatingSystem', value: data.heatingSystem, formId: 'heatingSystem' },
                    { name: 'Ventilationssystem', key: 'ventilationType', value: data.ventilationType, formId: 'ventilation' },
                    { name: 'Installerad effekt solceller', key: 'solarPower', value: data.solarPower, unit: 'kW', formId: 'solarPower' },
                    { name: 'Fastighetsel', key: 'buildingElectricity', value: data.buildingElectricity, unit: 'kWh/år', formId: 'buildingElectricity' },
                    { name: 'Varmvattenanvändning', key: 'waterUsage', value: data.waterUsage, unit: 'kWh/år', formId: 'waterUsage' },
                    { name: 'Byggår', key: 'constructionYear', value: data.constructionYear, formId: 'buildingYear' },
                    { name: 'Senaste renovering', key: 'lastRenovation', value: data.lastRenovation, formId: 'lastRenovation' },
                    // Add energy usage data
                    { name: 'Energi för uppvärmning', key: 'heatingEnergy', value: data.energyUsage.heating.fjarrvarme, unit: 'kWh/år', formId: 'heatingEnergy' },
                    { name: 'Energi för tappvarmvatten', key: 'hotWaterEnergy', value: data.energyUsage.hotWater.fjarrvarme, unit: 'kWh/år', formId: 'hotWaterEnergy' },
                    { name: 'Total energianvändning', key: 'totalEnergy', value: data.energyUsage.total, unit: 'kWh/år', formId: 'totalEnergy' }
                ];

                // Sort the array - found values first
                const sortedDataStatus = dataStatus.sort((a, b) => {
                    if (a.value && !b.value) return -1;
                    if (!a.value && b.value) return 1;
                    return 0;
                });

                // Create HTML for found and not found values
                const statusHTML = `
                    <div class="found-values mb-3">
                        <h6>Hittade värden:</h6>
                        <ul class="list-group">
                            ${sortedDataStatus.filter(item => item.value).map(item => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${item.name}
                                    <div>
                                        <span class="text-success me-2">
                                            <strong>${item.value}</strong>${item.unit ? ` ${item.unit}` : ''}
                                        </span>
                                        <button class="btn btn-sm btn-primary add-to-model" 
                                                data-value="${item.value}" 
                                                data-field="${item.formId}">
                                            Lägg till
                                        </button>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="not-found-values">
                        <h6>Ej hittade värden:</h6>
                        <ul class="list-group">
                            ${sortedDataStatus.filter(item => !item.value).map(item => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${item.name}
                                    <span class="badge bg-danger rounded-pill">Ej hittad</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;

                statusDiv.innerHTML = `
                    <div class="alert alert-info">
                        <h6>Sökresultat från energideklarationen:</h6>
                        ${statusHTML}
                    </div>
                `;

                // Add event listeners for the "Lägg till" buttons
                document.querySelectorAll('.add-to-model').forEach(button => {
                    button.addEventListener('click', function() {
                        const value = this.dataset.value;
                        const fieldId = this.dataset.field;
                        const field = document.getElementById(fieldId);
                        
                        if (field) {
                            field.value = value;
                            field.dispatchEvent(new Event('change')); // Trigger any change listeners
                            
                            // Visual feedback
                            this.classList.remove('btn-primary');
                            this.classList.add('btn-success');
                            this.textContent = 'Tillagt!';
                            this.disabled = true;
                        }
                    });
                });

            } catch (error) {
                console.error('Error processing PDF:', error);
                statusDiv.innerHTML = `
                    <div class="alert alert-danger">
                        Det gick inte att läsa PDF-filen. Kontrollera att det är en giltig energideklaration.
                        <br>
                        Felmeddelande: ${error.message}
                    </div>
                `;
            }
        } else {
            statusDiv.innerHTML = `
                <div class="alert alert-warning">
                    Vänligen välj en PDF-fil att bearbeta.
                </div>
            `;
        }
    });
}

function extractTextFromPDF(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            console.log('Extracted full text:', fullText); // Debug log
            resolve(fullText);
        } catch (error) {
            reject(error);
        }
    });
}

function parseEnergyDeclaration(text) {
    const data = {
        primaryEnergyNumber: null,
        heatingSystem: null,
        ventilationType: null,
        solarPower: null,
        buildingElectricity: null,
        waterUsage: null,
        constructionYear: null,
        lastRenovation: null,
        recommendedImprovements: [],
        energyUsage: {
            heating: {},
            hotWater: {}
        }
    };

    // Add patterns for each field
    const patterns = {
        constructionYear: /Nybyggnadsår:\s*(\d{4})/i,
        primaryEnergyNumber: /Primärenergital[^0-9]*(\d+)/i,
        heatingSystem: /Uppvärmningssystem:\s*([^ ]+)/i,
        ventilationType: /Ventilationssystem:\s*([^\n]+)/i,
        solarPower: /Installerad effekt solceller:\s*(\d+)/i,
        buildingElectricity: /Fastighetsel:\s*(\d+)/i,
        waterUsage: /Varmvattenanvändning:\s*(\d+)/i,
        lastRenovation: /Ombyggnadsår:\s*(\d{4})/i
    };

    // Try to match each pattern
    for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
            console.log(`Found ${key}:`, match[1]); // Debug log
            data[key] = match[1];
        }
    }

    // Existing fjärrvärme pattern matching
    const fjarrvarmePattern = /Fjärrvärme\s*\(1\)\s*(\d+)\s+(\d+)\s*kWh/i;
    const match = text.match(fjarrvarmePattern);
    
    if (match) {
        data.energyUsage.heating.fjarrvarme = parseInt(match[1]);
        data.energyUsage.hotWater.fjarrvarme = parseInt(match[2]);
    }

    // Calculate totals
    data.energyUsage.totalHeating = Object.values(data.energyUsage.heating).reduce((a, b) => a + b, 0);
    data.energyUsage.totalHotWater = Object.values(data.energyUsage.hotWater).reduce((a, b) => a + b, 0);
    data.energyUsage.total = data.energyUsage.totalHeating + data.energyUsage.totalHotWater;

    return data;
}

// Define source names globally
const sourceNames = {
    fjarrvarme: 'Fjärrvärme',
    eldningsolja: 'Eldningsolja',
    naturgas: 'Naturgas, stadsgas',
    ved: 'Ved',
    pellets: 'Flis/pellets/briketter',
    biobransle: 'Övrigt biobränsle',
    elVattenburen: 'El (vattenburen)',
    elDirektverkande: 'El (direktverkande)',
    elLuftburen: 'El (luftburen)',
    markvarmepump: 'Markvärmepump',
    varmepumpFranluft: 'Värmepump-frånluft',
    varmepumpLuftLuft: 'Värmepump-luft/luft',
    varmepumpLuftVatten: 'Värmepump-luft/vatten',
    tappvarmvatten: 'Tappvarmvatten'
};

// Update the displayEnergyUsageData function
function displayEnergyUsageData(energyUsage) {
    console.log('Displaying energy usage data:', energyUsage);
    
    // Check if the container exists
    const energyDisplay = document.getElementById('energyConsumption');
    if (!energyDisplay) {
        console.error('Could not find energyConsumption element');
        alert('Could not find the energy consumption display container');
        return;
    }

    // Create a container for the energy usage display
    const container = document.createElement('div');
    container.className = 'card mb-4';
    
    // Format numbers with thousand separators
    const formatNumber = (num) => num ? num.toLocaleString('sv-SE') : '0';

    // Create table rows
    let tableRows = '';
    Object.entries(sourceNames).forEach(([key, name]) => {
        const heating = energyUsage.heating[key] || 0;
        const hotWater = energyUsage.hotWater[key] || 0;
        const total = heating + hotWater;

        if (total > 0) {
            tableRows += `
                <tr>
                    <td>${name}</td>
                    <td class="text-end">${formatNumber(heating)}</td>
                    <td class="text-end">${formatNumber(hotWater)}</td>
                    <td class="text-end">${formatNumber(total)}</td>
                </tr>
            `;
        }
    });

    // Create the content
    container.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">Energianvändning från energideklaration</h5>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Energikälla</th>
                            <th class="text-end">Uppvärmning (kWh)</th>
                            <th class="text-end">Tappvarmvatten (kWh)</th>
                            <th class="text-end">Totalt (kWh)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr class="table-primary fw-bold">
                            <td>Totalt</td>
                            <td class="text-end">${formatNumber(energyUsage.totalHeating)}</td>
                            <td class="text-end">${formatNumber(energyUsage.totalHotWater)}</td>
                            <td class="text-end">${formatNumber(energyUsage.total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Add to the page
    energyDisplay.insertBefore(container, energyDisplay.firstChild);
    console.log('Table added to page');

    // Create the chart
    createEnergyUsageChart(energyUsage);
}

// Update the createEnergyUsageChart function
function createEnergyUsageChart(energyUsage) {
    const ctx = document.getElementById('energyUsageChart').getContext('2d');
    
    // Get non-zero values for the chart
    const datasets = [];
    let labels = [];
    
    // Add heating data
    const heatingData = Object.entries(energyUsage.heating)
        .filter(([_, value]) => value > 0);
    if (heatingData.length > 0) {
        datasets.push({
            label: 'Uppvärmning',
            data: heatingData.map(([_, value]) => value),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
        });
        labels = heatingData.map(([key, _]) => sourceNames[key]);
    }

    // Add hot water data
    const hotWaterData = Object.entries(energyUsage.hotWater)
        .filter(([_, value]) => value > 0);
    if (hotWaterData.length > 0) {
        datasets.push({
            label: 'Tappvarmvatten',
            data: hotWaterData.map(([_, value]) => value),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
        });
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'kWh'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Energianvändning per källa'
                }
            }
        }
    });
}
// Update the applyEnergyDeclarationData function to include the new display
function applyEnergyDeclarationData(data) {
    // Enhanced mappings based on the extracted data
    const mappings = {
        constructionYear: {
            field: 'constructionYear',
            transform: (value) => parseInt(value)
        },
        lastRenovation: {
            field: 'lastRenovation',
            transform: (value) => parseInt(value)
        },
        heatingSystem: {
            field: 'heatingSystem',
            transform: (value) => {
                value = value.toLowerCase();
                if (value.includes('fjärrvärme')) return 'district';
                if (value.includes('värmepump')) return 'heatpump';
                if (value.includes('direktverkande')) return 'electric';
                if (value.includes('gas')) return 'gas';
                return 'district'; // default
            }
        },
        ventilationType: {
            field: 'ventilationType',
            transform: (value) => {
                value = value.toLowerCase();
                if (value.includes('ftx')) return 'ftx';
                if (value.includes('mekanisk')) return 'mechanical';
                if (value.includes('självdrag')) return 'natural';
                return 'natural'; // default
            }
        }
    };

    // Apply the data to the form
    for (const [dataKey, mapping] of Object.entries(mappings)) {
        if (data[dataKey]) {
            const element = document.getElementById(mapping.field);
            if (element) {
                const value = mapping.transform(data[dataKey]);
                element.value = value;
                element.dispatchEvent(new Event('change'));
            }
        }
    }

    // Handle recommended improvements
    if (data.recommendedImprovements && data.recommendedImprovements.length > 0) {
        // Create a summary of recommendations
        const recommendationsHtml = `
            <div class="alert alert-info mt-3">
                <h6>Rekommenderade åtgärder från energideklarationen:</h6>
                <ul>
                    ${data.recommendedImprovements.map(imp => `
                        <li>
                            ${imp.description}
                            ${imp.savings ? `(Besparing: ${imp.savings} kr/år)` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        // Add recommendations to the energy consumption display
        const energyDisplay = document.getElementById('energyConsumption');
        if (energyDisplay) {
            energyDisplay.insertAdjacentHTML('afterbegin', recommendationsHtml);
        }
    }

    // Add the energy usage display if we have data
    if (data.energyUsage && (data.energyUsage.totalHeating > 0 || data.energyUsage.totalHotWater > 0)) {
        displayEnergyUsageData(data.energyUsage);
    }
}

function addEnvironment() {
    // Add ground plane with grass texture
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3b7d3b,
        shininess: 0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);

    // Add decorative trees around the scene
    const treePositions = [
        { x: -15, z: -15 }, { x: 15, z: -15 },
        { x: -20, z: 0 }, { x: 20, z: 0 },
        { x: -15, z: 15 }, { x: 15, z: 15 }
    ];

    treePositions.forEach(pos => {
        addDecorationTree(pos.x, pos.z);
    });

    // Add some bushes
    const bushPositions = [
        { x: -8, z: -8 }, { x: 8, z: -8 },
        { x: -10, z: 5 }, { x: 10, z: 5 }
    ];

    bushPositions.forEach(pos => {
        addBush(pos.x, pos.z);
    });
}

function addDecorationTree(x, z) {
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3219 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);
    scene.add(trunk);

    // Tree top (multiple layers for more realistic look)
    const treeColors = [0x1d4d1d, 0x235c23, 0x2d682d];
    let yOffset = 2;
    
    for (let i = 0; i < 3; i++) {
        const topGeometry = new THREE.ConeGeometry(2 - i * 0.3, 3, 8);
        const topMaterial = new THREE.MeshPhongMaterial({ 
            color: treeColors[i],
            shininess: 0
        });
        const treeTop = new THREE.Mesh(topGeometry, topMaterial);
        treeTop.position.set(x, yOffset, z);
        scene.add(treeTop);
        yOffset += 1.5;
    }
}

function addBush(x, z) {
    const bushGeometry = new THREE.SphereGeometry(1, 8, 8);
    const bushMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2d5a27,
        shininess: 0
    });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(x, 0.5, z);
    bush.scale.y = 0.7; // Make it slightly squashed
    scene.add(bush);
}

