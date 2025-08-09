// Global variables
let map;
let markers = [];
let infrastructureData = [];
let infoWindow;

// Infrastructure type configurations
const infrastructureTypes = {
    'gas processing plant': {
        color: '#28a745',
        icon: '🏭',
        filterId: 'filter-gas-processing'
    },
    'crude oil refinery': {
        color: '#dc3545',
        icon: '⚡',
        filterId: 'filter-refineries'
    },
    'flow station': {
        color: '#ffc107',
        icon: '🛢️',
        filterId: 'filter-flow-stations'
    },
    'pipeline': {
        color: '#17a2b8',
        icon: '🔗',
        filterId: 'filter-pipelines'
    },
    'liquefaction plant': {
        color: '#6f42c1',
        icon: '❄️',
        filterId: 'filter-liquefaction'
    },
    'CNG mother station': {
        color: '#fd7e14',
        icon: '⛽',
        filterId: 'filter-cng-stations'
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeMap();
    setupEventListeners();
    setupFilters();
});

// Initialize Google Maps
function initializeMap() {
    // Nigeria center coordinates
    const nigeriaCenter = { lat: 9.0820, lng: 8.6753 };

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: nigeriaCenter,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            {
                featureType: 'administrative',
                elementType: 'geometry',
                stylers: [{ visibility: 'simplified' }]
            },
            {
                featureType: 'poi',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    infoWindow = new google.maps.InfoWindow();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('fetchData').addEventListener('click', fetchInfrastructureData);
    document.getElementById('exportData').addEventListener('click', exportInfrastructureData);
    document.getElementById('clearMap').addEventListener('click', clearMap);

    // Modal close functionality
    const modal = document.getElementById('infoModal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Setup filter event listeners
function setupFilters() {
    Object.values(infrastructureTypes).forEach(type => {
        const filterElement = document.getElementById(type.filterId);
        if (filterElement) {
            filterElement.addEventListener('change', updateMapVisibility);
        }
    });
}

// Fetch infrastructure data from the API
async function fetchInfrastructureData() {
    const mapOverlay = document.getElementById('mapOverlay');
    const fetchButton = document.getElementById('fetchData');
    const exportButton = document.getElementById('exportData');

    try {
        // Show loading state
        mapOverlay.classList.add('show');
        fetchButton.disabled = true;
        fetchButton.textContent = 'Fetching...';

        const response = await fetch('/api/infrastructure');
        const data = await response.json();

        if (data.success) {
            infrastructureData = data.data;
            displayInfrastructureOnMap();
            updateSidebar();
            exportButton.disabled = false; // Enable export button
            showNotification(`Successfully loaded ${data.count} infrastructure facilities`, 'success');
        } else {
            throw new Error(data.error || 'Failed to fetch data');
        }

    } catch (error) {
        console.error('Error fetching infrastructure data:', error);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        // Hide loading state
        mapOverlay.classList.remove('show');
        fetchButton.disabled = false;
        fetchButton.textContent = 'Fetch Infrastructure Data';
    }
}

// Display infrastructure on the map
function displayInfrastructureOnMap() {
    clearMarkers();

    infrastructureData.forEach(facility => {
        if (facility.coordinates && facility.coordinates.lat && facility.coordinates.lng) {
            const marker = createMarker(facility);
            markers.push(marker);
        }
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });
        map.fitBounds(bounds);
    }
}

// Create a marker for a facility
function createMarker(facility) {
    const typeConfig = infrastructureTypes[facility.type] || infrastructureTypes['gas processing plant'];

    const marker = new google.maps.Marker({
        position: { lat: facility.coordinates.lat, lng: facility.coordinates.lng },
        map: map,
        title: facility.name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: typeConfig.color,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2
        },
        label: {
            text: typeConfig.icon,
            fontSize: '12px'
        }
    });

    // Store facility data with marker for filtering
    marker.facility = facility;

    // Add click event listener
    marker.addListener('click', () => {
        showFacilityInfo(facility, marker);
    });

    return marker;
}

// Show facility information in info window
function showFacilityInfo(facility, marker) {
    const content = `
        <div style="font-family: 'Inter', sans-serif; max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">${facility.name}</h3>
            <p style="margin: 5px 0; color: #495057; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${facility.type}
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 13px;">
                <strong>Location:</strong> ${facility.location}
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 13px;">
                <strong>Address:</strong> ${facility.address || 'Not available'}
            </p>
            ${facility.phone ? `<p style="margin: 5px 0; color: #666; font-size: 13px;"><strong>Phone:</strong> ${facility.phone}</p>` : ''}
            ${facility.website ? `<p style="margin: 5px 0; color: #666; font-size: 13px;"><strong>Website:</strong> <a href="${facility.website}" target="_blank">Visit</a></p>` : ''}
        </div>
    `;

    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// Update map visibility based on filters
function updateMapVisibility() {
    const visibleTypes = [];

    Object.entries(infrastructureTypes).forEach(([type, config]) => {
        const filterElement = document.getElementById(config.filterId);
        if (filterElement && filterElement.checked) {
            visibleTypes.push(type);
        }
    });

    // Show/hide markers based on filters
    markers.forEach(marker => {
        const facility = marker.facility;
        const isVisible = visibleTypes.includes(facility.type);
        marker.setVisible(isVisible);
    });

    // Update sidebar
    updateSidebar();
}

// Update sidebar with filtered data
function updateSidebar() {
    const visibleTypes = [];

    Object.entries(infrastructureTypes).forEach(([type, config]) => {
        const filterElement = document.getElementById(config.filterId);
        if (filterElement && filterElement.checked) {
            visibleTypes.push(type);
        }
    });

    const visibleFacilities = infrastructureData.filter(facility =>
        visibleTypes.includes(facility.type)
    );

    // Update statistics
    document.getElementById('totalCount').textContent = infrastructureData.length;
    document.getElementById('visibleCount').textContent = visibleFacilities.length;

    // Update facilities list
    updateFacilitiesList(visibleFacilities);
}

// Update facilities list in sidebar
function updateFacilitiesList(facilities) {
    const facilitiesList = document.getElementById('facilitiesList');

    if (facilities.length === 0) {
        facilitiesList.innerHTML = '<p class="empty-state">No facilities match the current filters</p>';
        return;
    }

    facilitiesList.innerHTML = facilities.map(facility => `
        <div class="facility-item" onclick="showFacilityModal('${facility.id}')">
            <div class="facility-name">${facility.name}</div>
            <div class="facility-type">${facility.type}</div>
            <div class="facility-address">${facility.address || facility.location}</div>
        </div>
    `).join('');
}

// Show facility modal
function showFacilityModal(facilityId) {
    const facility = infrastructureData.find(f => f.id === facilityId);
    if (!facility) return;

    const modal = document.getElementById('infoModal');
    const modalContent = document.getElementById('modalContent');

    modalContent.innerHTML = `
        <h2>${facility.name}</h2>
        <div class="modal-info">
            <p><strong>Type:</strong> ${facility.type}</p>
            <p><strong>Location:</strong> ${facility.location}</p>
            <p><strong>Address:</strong> ${facility.address || 'Not available'}</p>
            ${facility.phone ? `<p><strong>Phone:</strong> ${facility.phone}</p>` : ''}
            ${facility.website ? `<p><strong>Website:</strong> <a href="${facility.website}" target="_blank">${facility.website}</a></p>` : ''}
            <p><strong>Coordinates:</strong> ${facility.coordinates.lat}, ${facility.coordinates.lng}</p>
        </div>
    `;

    modal.style.display = 'block';
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

// Clear the map
function clearMap() {
    clearMarkers();
    infrastructureData = [];
    updateSidebar();
    document.getElementById('facilitiesList').innerHTML = '<p class="empty-state">Click "Fetch Infrastructure Data" to load facilities</p>';
    document.getElementById('exportData').disabled = true; // Disable export button
    showNotification('Map cleared', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;

    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };

    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export infrastructure data functionality
function exportInfrastructureData() {
    if (!infrastructureData || infrastructureData.length === 0) {
        showNotification('No data to export. Please fetch infrastructure data first.', 'warning');
        return;
    }

    // Get currently visible facilities based on filters
    const visibleTypes = [];
    Object.entries(infrastructureTypes).forEach(([type, config]) => {
        const filterElement = document.getElementById(config.filterId);
        if (filterElement && filterElement.checked) {
            visibleTypes.push(type);
        }
    });

    const visibleFacilities = infrastructureData.filter(facility =>
        visibleTypes.includes(facility.type)
    );

    // Show export options modal
    showExportModal(visibleFacilities);
}

// Show export options modal
function showExportModal(data) {
    const modal = document.getElementById('infoModal');
    const modalContent = document.getElementById('modalContent');

    modalContent.innerHTML = `
        <h2>Export Infrastructure Data</h2>
        <div class="export-options">
            <p>Choose export format for ${data.length} facilities:</p>
            <div class="export-buttons">
                <button class="btn btn-export" onclick="exportToCSV(${JSON.stringify(data).replace(/"/g, '&quot;')})">
                    📊 Export as CSV
                    <small>Excel-compatible spreadsheet</small>
                </button>
                <button class="btn btn-export" onclick="exportToExcel(${JSON.stringify(data).replace(/"/g, '&quot;')})">
                    📈 Export as Excel
                    <small>Microsoft Excel format</small>
                </button>
                <button class="btn btn-export" onclick="exportToPDF(${JSON.stringify(data).replace(/"/g, '&quot;')})">
                    📄 Export as PDF Report
                    <small>Professional report format</small>
                </button>
            </div>
        </div>
    `;

    // Add styles for export modal
    const exportStyles = `
        <style>
            .export-options {
                text-align: center;
                padding: 1rem 0;
            }
            .export-buttons {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-top: 1.5rem;
            }
            .export-buttons .btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 1rem;
                text-align: center;
                gap: 0.5rem;
            }
            .export-buttons .btn small {
                font-size: 0.8rem;
                opacity: 0.8;
                font-weight: normal;
            }
        </style>
    `;

    modalContent.innerHTML += exportStyles;
    modal.style.display = 'block';
}

// Export to CSV
function exportToCSV(data) {
    const headers = [
        'Name',
        'Type',
        'Location',
        'Address',
        'Phone',
        'Website',
        'Latitude',
        'Longitude'
    ];

    const csvContent = [
        headers.join(','),
        ...data.map(facility => [
            `"${(facility.name || '').replace(/"/g, '""')}"`,
            `"${(facility.type || '').replace(/"/g, '""')}"`,
            `"${(facility.location || '').replace(/"/g, '""')}"`,
            `"${(facility.address || '').replace(/"/g, '""')}"`,
            `"${(facility.phone || '').replace(/"/g, '""')}"`,
            `"${(facility.website || '').replace(/"/g, '""')}"`,
            facility.coordinates?.lat || '',
            facility.coordinates?.lng || ''
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nigeria-oil-gas-infrastructure-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    document.getElementById('infoModal').style.display = 'none';
    showNotification('CSV file downloaded successfully!', 'success');
}

// Export to Excel (using HTML table format that Excel can read)
function exportToExcel(data) {
    const headers = [
        'Name',
        'Type',
        'Location',
        'Address',
        'Phone',
        'Website',
        'Latitude',
        'Longitude'
    ];

    let excelContent = `
        <table border="1">
            <thead>
                <tr style="background-color: #4472C4; color: white; font-weight: bold;">
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.map(facility => `
                    <tr>
                        <td>${facility.name || ''}</td>
                        <td>${facility.type || ''}</td>
                        <td>${facility.location || ''}</td>
                        <td>${facility.address || ''}</td>
                        <td>${facility.phone || ''}</td>
                        <td>${facility.website || ''}</td>
                        <td>${facility.coordinates?.lat || ''}</td>
                        <td>${facility.coordinates?.lng || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nigeria-oil-gas-infrastructure-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();

    document.getElementById('infoModal').style.display = 'none';
    showNotification('Excel file downloaded successfully!', 'success');
}

// Export to PDF
function exportToPDF(data) {
    // Create a comprehensive HTML report
    const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const typeStats = {};
    data.forEach(facility => {
        typeStats[facility.type] = (typeStats[facility.type] || 0) + 1;
    });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Nigeria Oil & Gas Infrastructure Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #4472C4;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #4472C4;
                    margin: 0;
                    font-size: 24px;
                }
                .header p {
                    color: #666;
                    margin: 10px 0 0 0;
                }
                .summary {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                .summary h2 {
                    color: #4472C4;
                    margin-top: 0;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 15px 0;
                }
                .stat-card {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #4472C4;
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #4472C4;
                }
                .stat-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                    font-size: 11px;
                }
                th {
                    background-color: #4472C4;
                    color: white;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Nigeria Oil & Gas Infrastructure Report</h1>
                <p>Comprehensive Database of Energy Infrastructure Facilities</p>
                <p>Generated on ${reportDate}</p>
            </div>

            <div class="summary">
                <h2>Executive Summary</h2>
                <p>This report contains detailed information about ${data.length} oil and gas infrastructure facilities across Nigeria, including their locations, contact information, and facility types.</p>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${data.length}</div>
                        <div class="stat-label">Total Facilities</div>
                    </div>
                    ${Object.entries(typeStats).map(([type, count]) => `
                        <div class="stat-card">
                            <div class="stat-number">${count}</div>
                            <div class="stat-label">${type.replace(/\b\w/g, l => l.toUpperCase())}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <h2>Detailed Facility List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Facility Name</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Address</th>
                        <th>Phone</th>
                        <th>Coordinates</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(facility => `
                        <tr>
                            <td>${facility.name || 'N/A'}</td>
                            <td>${facility.type || 'N/A'}</td>
                            <td>${facility.location || 'N/A'}</td>
                            <td>${facility.address || 'N/A'}</td>
                            <td>${facility.phone || 'N/A'}</td>
                            <td>${facility.coordinates?.lat && facility.coordinates?.lng ?
            `${facility.coordinates.lat.toFixed(4)}, ${facility.coordinates.lng.toFixed(4)}` : 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                <p>This report was generated using Google Maps API data. Information is current as of ${reportDate}.</p>
                <p>For the most up-to-date information, please verify details directly with facility operators.</p>
            </div>
        </body>
        </html>
    `;

    // Create and download the HTML file (can be opened and printed as PDF)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nigeria-oil-gas-infrastructure-report-${new Date().toISOString().split('T')[0]}.html`;
    link.click();

    document.getElementById('infoModal').style.display = 'none';
    showNotification('PDF report downloaded! Open the HTML file and print to PDF.', 'success');
}
