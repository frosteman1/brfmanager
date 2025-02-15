// Building settings functions
function getBuildingSettings() {
    // Add default values and null checks
    const floors = document.getElementById('floors-0');
    const width = document.getElementById('width-0');
    const length = document.getElementById('length-0');
    const location = document.getElementById('location');
    const shadowing = document.getElementById('shadowing');
    const ventilation = document.getElementById('ventilation');
    const hasBalconies = document.getElementById('hasBalconies');

    return {
        floors: floors ? parseInt(floors.value) || 3 : 3,
        width: width ? parseInt(width.value) || 20 : 20,
        length: length ? parseInt(length.value) || 30 : 30,
        location: location ? location.value : 'Stockholm',
        shadowing: shadowing ? shadowing.value : 'none',
        ventilation: ventilation ? ventilation.value : 'natural',
        hasBalconies: hasBalconies ? hasBalconies.checked : true,
    };
}

function loadBuildingSettings() {
    const savedSettings = localStorage.getItem('buildingSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
                element.dispatchEvent(new Event('change'));
            }
        });
    }
}

function saveBuildingSettings() {
    const settings = {};
    ['floors-0', 'width-0', 'length-0', 'location', 'shadowing', 'ventilation', 'hasBalconies'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            settings[id] = element.type === 'checkbox' ? element.checked : element.value;
        }
    });
    localStorage.setItem('buildingSettings', JSON.stringify(settings));
}

// Make functions globally available
window.getBuildingSettings = getBuildingSettings;
window.loadBuildingSettings = loadBuildingSettings;
window.saveBuildingSettings = saveBuildingSettings; 