// Data structure for maintenance items
let maintenanceItems = [];

// Initialize charts
let yearlyChart, categoryChart, buildingChart, statusChart;

document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    loadMaintenanceItems();
    setupEventListeners();
});

function setupEventListeners() {
    const form = document.getElementById('maintenanceForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        addMaintenanceItem();
    });
}

function addMaintenanceItem() {
    const form = document.getElementById('maintenanceForm');
    const editItemId = form.dataset.editItemId;
    
    // Använd MongoDB-kompatibelt ID-format
    const item = {
        _id: editItemId || new Date().getTime().toString(), // Använd _id istället för id
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        cost: parseInt(document.getElementById('cost').value),
        plannedYear: parseInt(document.getElementById('plannedYear').value),
        priority: document.getElementById('priority').value,
        status: 'Planerad',
        interval: 30,
        name: document.getElementById('description').value,
        date: new Date().toISOString().split('T')[0]
    };

    if (editItemId) {
        maintenanceItems = maintenanceItems.map(i => i._id === editItemId ? item : i);
        form.dataset.editItemId = '';
        form.querySelector('button[type="submit"]').textContent = 'Lägg till';
    } else {
        maintenanceItems.push(item);
    }

    updateCharts();
    saveMaintenanceItems();
    renderMaintenanceList();
    form.reset();
}

function initializeCharts() {
    // Yearly costs chart
    const yearlyCtx = document.getElementById('yearlyChart').getContext('2d');
    yearlyChart = new Chart(yearlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Kostnad per år',
                data: [],
                backgroundColor: 'rgba(255, 159, 64, 0.8)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => value.toLocaleString('sv-SE') + ' kr'
                    }
                }
            }
        }
    });

    // Category pie chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FFD700', // Teknik
                    '#FF6B6B', // Fasad
                    '#4ECDC4', // Invändigt
                    '#45B7D1', // VVS
                    '#96CEB4', // Mark
                    '#FFEEAD'  // Övrigt
                ]
            }]
        }
    });

    // Initialize other charts similarly...
}

function updateCharts() {
    // Update yearly chart
    const yearlyData = {};
    maintenanceItems.forEach(item => {
        yearlyData[item.plannedYear] = (yearlyData[item.plannedYear] || 0) + item.cost;
    });

    const years = Object.keys(yearlyData).sort();
    yearlyChart.data.labels = years;
    yearlyChart.data.datasets[0].data = years.map(year => yearlyData[year]);
    yearlyChart.update();

    // Update category chart
    const categoryData = {};
    maintenanceItems.forEach(item => {
        categoryData[item.category] = (categoryData[item.category] || 0) + item.cost;
    });

    categoryChart.data.labels = Object.keys(categoryData);
    categoryChart.data.datasets[0].data = Object.values(categoryData);
    categoryChart.update();

    // Update total costs
    updateTotalCosts();
}

function updateTotalCosts() {
    const totalCost = maintenanceItems.reduce((sum, item) => sum + item.cost, 0);
    const averageYearlyCost = totalCost / 30; // Assuming 30-year plan
    const costPerSquareMeter = averageYearlyCost / 1000; // Assuming 1000 m²

    document.getElementById('totalCost').textContent = totalCost.toLocaleString('sv-SE') + ' kr';
    document.getElementById('costPerYear').textContent = Math.round(averageYearlyCost).toLocaleString('sv-SE') + ' kr per år';
    document.getElementById('costPerSquareMeter').textContent = Math.round(costPerSquareMeter) + ' kr per år och m²';
}

async function saveMaintenanceItems() {
    try {
        const token = localStorage.getItem('token');
    
        if (!token) {
            throw new Error('Du måste vara inloggad för att spara underhållsplanen');
        }

        // Validera data innan vi skickar
        if (!Array.isArray(maintenanceItems) || maintenanceItems.length === 0) {
            throw new Error('Inga underhållsposter att spara');
        }

        const headers = {
            'Content-Type': 'application/json',
            'x-auth-token': token
        };

        // Förbered och validera data
        const itemsToSave = maintenanceItems.map(item => {
            // Validera required fält
            if (!item.category || !item.description || !item.cost || !item.plannedYear || !item.priority) {
                throw new Error('Alla required fält måste fyllas i');
            }

            return {
                category: item.category,
                description: item.description,
                cost: parseInt(item.cost),
                plannedYear: parseInt(item.plannedYear),
                priority: item.priority,
                status: item.status || 'Planerad',
                interval: parseInt(item.interval) || 30,
                name: item.description, // Använd description som name
                date: item.date || new Date().toISOString().split('T')[0],
                // Valfria fält
                projectId: item.projectId,
                energySaving: item.energySaving,
                location: item.location,
                building: item.building,
                actualCost: item.actualCost ? parseInt(item.actualCost) : undefined
            };
        });

        console.log('Prepared items to save:', itemsToSave);

        const response = await fetch('/api/maintenance/save', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ maintenanceItems: itemsToSave })
        });

        console.log('Full response:', response);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers]));

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error details:', errorData);
            throw new Error(errorData.message || 'Failed to save maintenance items');
        }

        const result = await response.json();
        console.log('Save successful:', result);
        
        // Uppdatera lokala items med server response
        if (result.items) {
            maintenanceItems = result.items;
            renderMaintenanceList();
        }
        
    } catch (error) {
        console.error('Error saving maintenance items:', error);
        console.error('Stack trace:', error.stack);
        console.error('Request data:', {
            maintenanceItems,
            token: token ? 'Token exists' : 'No token'
        });
        alert(error.message || 'Det gick inte att spara underhållsplanen. Försök igen senare.');
    }
}

async function loadMaintenanceItems() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found');
        }

        const response = await fetch('/api/maintenance/load', {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load maintenance items');
        }

        const data = await response.json();
        maintenanceItems = data.maintenanceItems.map(item => ({
            ...item,
            id: item._id // Säkerställ att vi har både _id och id
        }));
        
        console.log('Loaded items:', maintenanceItems);
        
        updateCharts();
        renderMaintenanceList();
    } catch (error) {
        console.error('Error loading maintenance items:', error);
        alert('Kunde inte ladda underhållsplanen. Försök igen senare.');
    }
}

// Add this function to create the maintenance list
function renderMaintenanceList() {
    const listContainer = document.getElementById('maintenanceList');
    const groupedItems = groupItemsByYear(maintenanceItems);
    
    let html = '';
    
    // Sort years in ascending order
    const years = Object.keys(groupedItems).sort();
    
    years.forEach(year => {
        const yearTotal = groupedItems[year].reduce((sum, item) => sum + item.cost, 0);
        
        html += `
        <div class="year-section mb-3">
            <div class="year-header bg-secondary text-white p-2 d-flex justify-content-between">
                <h5 class="mb-0">${year}</h5>
                <span>${yearTotal.toLocaleString('sv-SE')} kr</span>
            </div>
            <div class="maintenance-items">
                ${groupedItems[year].map(item => `
                    <div class="maintenance-item p-2 border-bottom">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center" style="width: 70%;">
                                <div class="status-indicator ${getStatusClass(item.status)}"></div>
                                <div class="ms-3" style="width: 100%;">
                                    <div class="d-flex justify-content-between mb-1">
                                        <h6 class="mb-0">${item.description}</h6>
                                        <div class="project-tags">
                                            ${item.projectId ? `<span class="badge bg-danger me-2">Projekt ${item.projectId}</span>` : ''}
                                            ${item.energySaving ? '<span class="badge bg-success">Energibesparing</span>' : ''}
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-between text-muted small">
                                        <div>
                                            <span class="me-3">${item.category}</span>
                                            ${item.location ? `<span class="me-3">${item.location}</span>` : ''}
                                            ${item.building ? `<span>${item.building}</span>` : ''}
                                        </div>
                                        <span>${getIntervalText(item.interval)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center">
                                <div class="me-4">
                                    <div class="text-end">${item.cost.toLocaleString('sv-SE')} kr</div>
                                    ${item.actualCost ? `
                                        <div class="text-muted small">
                                            Faktisk kostnad: ${item.actualCost.toLocaleString('sv-SE')} kr 
                                            (${Math.round((item.actualCost - item.cost) / item.cost * 100)}%)
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="status-dropdown me-3">
                                    <select class="form-select form-select-sm" 
                                            onchange="updateStatus('${item._id || item.id}', this.value)"
                                            style="min-width: 100px;">
                                        <option value="Planerad" ${item.status === 'Planerad' ? 'selected' : ''}>Planerad</option>
                                        <option value="Akut" ${item.status === 'Akut' ? 'selected' : ''}>Akut</option>
                                        <option value="Genomförd" ${item.status === 'Genomförd' ? 'selected' : ''}>Genomförd</option>
                                        <option value="Efterstatt" ${item.status === 'Efterstatt' ? 'selected' : ''}>Efterstatt</option>
                                    </select>
                                </div>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-secondary" onclick="editItem(${item.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${item.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        `;
    });
    listContainer.innerHTML = html;
}

// Helper functions
function groupItemsByYear(items) {
    return items.reduce((groups, item) => {
        const year = item.plannedYear;
        if (!groups[year]) {
            groups[year] = [];
        }
        groups[year].push(item);
        return groups;
    }, {});
}

function getStatusClass(status) {
    const statusClasses = {
        'Planerad': 'status-planned',
        'Akut': 'status-urgent',
        'Genomförd': 'status-completed',
        'Efterstatt': 'status-delayed'
    };
    return statusClasses[status] || 'status-planned';
}

function getIntervalText(interval) {
    return `${interval} år`;
}

// Add these functions for editing and deleting items
function editItem(itemId) {
    const item = maintenanceItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Populate form with item data
    document.getElementById('category').value = item.category;
    document.getElementById('description').value = item.description;
    document.getElementById('cost').value = item.cost;
    document.getElementById('plannedYear').value = item.plannedYear;
    document.getElementById('priority').value = item.priority;
    
    // Change form submit button to update
    const form = document.getElementById('maintenanceForm');
    form.dataset.editItemId = itemId;
    form.querySelector('button[type="submit"]').textContent = 'Uppdatera';
}

function deleteItem(itemId) {
    if (confirm('Är du säker på att du vill ta bort denna åtgärd?')) {
        maintenanceItems = maintenanceItems.filter(item => item.id !== itemId);
        saveMaintenanceItems();
        updateCharts();
        renderMaintenanceList();
    }
}

function updateStatus(itemId, newStatus) {
    console.log(`Attempting to update status. ItemId: ${itemId}, NewStatus: ${newStatus}`);
    
    // Hitta item med antingen _id eller id
    const item = maintenanceItems.find(i => 
        (i._id === itemId) || (i.id && i.id.toString() === itemId.toString())
    );
    
    if (item) {
        console.log('Found item to update:', item);
        item.status = newStatus;
        saveMaintenanceItems();
        updateCharts();
        renderMaintenanceList();
    } else {
        console.error(`Could not find item with id ${itemId}`);
        console.log('Available items:', maintenanceItems);
    }
}

// Add this CSS to your stylesheet
const styles = `
.status-indicator {
    width: 4px;
    height: 24px;
    border-radius: 2px;
}

.status-planned { background-color: #6c757d; }
.status-urgent { background-color: #dc3545; }
.status-completed { background-color: #28a745; }
.status-delayed { background-color: #ffc107; }

.maintenance-item:hover {
    background-color: #f8f9fa;
}
`;