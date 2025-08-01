// DOM Elements (same as before)
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsSection = document.getElementById('results-section');
const locationText = document.getElementById('location-text');
const refreshLocationBtn = document.getElementById('refresh-location');
const loadingOverlay = document.getElementById('loading-overlay');
const lastUpdatedSpan = document.getElementById('last-updated');

// Global variables
let products = [];
let lastUpdated = new Date().toISOString().split('T')[0]; // Current date as YYYY-MM-DD

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set last updated date
    lastUpdatedSpan.textContent = lastUpdated;
    
    // Load product data from CSV
    loadProductData();
    
    // Set up event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    refreshLocationBtn.addEventListener('click', detectLocation);
    
    // Detect location on page load
    detectLocation();
});

// Function to load product data from CSV
function loadProductData() {
    showLoading(true);
    
    // Fetch the CSV file
    fetch('data/data1.csv')
        .then(response => response.text())
        .then(csvData => {
            // Parse CSV data
            products = parseCSV(csvData);
            showLoading(false);
            
            // Display all products initially
            displayResults(products);
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            showLoading(false);
            locationText.textContent = 'Error loading product data. Please try again later.';
        });
}

// Function to parse CSV data
function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        
        const obj = {};
        const currentline = lines[i].split(',');
        
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j].trim();
            let value = currentline[j] ? currentline[j].trim() : '';
            
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            
            // Convert price fields to numbers
            if (header.endsWith('_price')) {
                value = parseFloat(value) || 0;
            }
            
            obj[header] = value;
        }
        
        result.push(obj);
    }
    
    return result;
}

// Function to handle search
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        // If search is empty, show all products
        displayResults(products);
    } else {
        // Filter products based on search term
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm)
        );
        
        displayResults(filteredProducts);
    }
}

// Function to display search results
function displayResults(filteredProducts) {
    resultsSection.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results visible';
        noResults.innerHTML = `
            <i class="fas fa-search" style="font-size: 40px; margin-bottom: 15px;"></i>
            <p>No products found matching your search.</p>
            <p>Try different keywords or check back later.</p>
        `;
        resultsSection.appendChild(noResults);
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card visible';
        
        // Get all available platforms and prices
        const platforms = [
            { name: 'blinkit', price: product.blinkit_price, logo: 'blinkit.png', url: 'https://blinkit.com' },
            { name: 'zepto', price: product.zepto_price, logo: 'zepto.png', url: 'https://zepto.com' },
            { name: 'bigbasket', price: product.bigbasket_price, logo: 'bigbasket.png', url: 'https://bigbasket.com' },
            { name: 'swiggy', price: product.swiggy_price, logo: 'swiggy.png', url: 'https://www.swiggy.com/instamart' },
            { name: 'dmart', price: product.dmart_price, logo: 'dmart.png', url: 'https://www.dmart.in/ready' },
            { name: 'jiomart', price: product.jiomart_price, logo: 'jiomart.png', url: 'https://www.jiomart.com' },
            { name: 'flipkart', price: product.flipkart_price, logo: 'flipkart.png', url: 'https://www.flipkart.com/grocery' }
        ].filter(platform => product[`${platform.name}_price`] !== undefined);
        
        // Find the best price
        const minPrice = Math.min(...platforms.map(p => p.price));
        const bestPlatforms = platforms.filter(p => p.price === minPrice).map(p => p.name);
        
        // Generate platform price items
        const platformItems = platforms.map(platform => `
            <div class="price-item ${bestPlatforms.includes(platform.name) ? 'best-price' : ''}">
                <div class="price-platform">
                    <img src="images/${platform.logo}" alt="${platform.name}" style="height: 20px;">
                    ${platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}
                </div>
                <div class="price-amount">₹${platform.price}</div>
                ${platform.price !== minPrice ? 
                    `<div class="price-difference">₹${platform.price - minPrice} more</div>` : 
                    '<div class="price-difference">Best price!</div>'}
                <div class="delivery-info">${getDeliveryInfo(product.free_delivery_platform, platform.name)}</div>
                <a href="${platform.url}" target="_blank" class="view-product">View on ${platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}</a>
            </div>
        `).join('');
        
        productCard.innerHTML = `
            <div class="product-header">
                <div>
                    <div class="product-name">${product.name}</div>
                    <div class="best-deal">${product.best_discount || 'Check platforms for best deal'}</div>
                </div>
            </div>
            <div class="price-comparison">
                ${platformItems}
            </div>
        `;
        
        resultsSection.appendChild(productCard);
    });
}
// Helper function to get delivery info
function getDeliveryInfo(deliveryString, platform) {
    if (deliveryString.includes(platform)) {
        return `<i class="fas fa-truck"></i> ${deliveryString.split('(')[1].replace(')', '')}`;
    }
    return '<i class="fas fa-truck"></i> Delivery charges apply';
}

// Location detection functions (same as before)
function detectLocation() {
    showLoading(true);
    locationText.textContent = 'Detecting your precise location...';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                reverseGeocodeWithFullAddress(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                showLoading(false);
                handleLocationError(error);
            },
            {
                enableHighAccuracy: true, // Request best possible accuracy
                timeout: 10000, // 10 seconds timeout
                maximumAge: 0 // Don't use cached position
            }
        );
    } else {
        showLoading(false);
        locationText.textContent = 'Geolocation not supported by your browser.';
    }
}

function reverseGeocodeWithFullAddress(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            showLoading(false);
            const address = buildFullAddress(data.address);
            locationText.textContent = `Delivering to: ${address}`;
            
            // Store coordinates for potential reuse
            localStorage.setItem('lastKnownLat', lat);
            localStorage.setItem('lastKnownLng', lng);
            localStorage.setItem('lastKnownAddress', address);
        })
        .catch(error => {
            console.error('Error in reverse geocoding:', error);
            showLoading(false);
            // Fallback to coordinates if address lookup fails
            locationText.textContent = `Near coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        });
}

function buildFullAddress(address) {
    if (!address) return 'your location';
    
    let parts = [];
    
    // Building number and street
    if (address.house_number && address.road) {
        parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
        parts.push(address.road);
    }
    
    // Neighborhood or suburb
    if (address.neighbourhood) {
        parts.push(address.neighbourhood);
    } else if (address.suburb) {
        parts.push(address.suburb);
    }
    
    // City/town/village
    if (address.city) {
        parts.push(address.city);
    } else if (address.town) {
        parts.push(address.town);
    } else if (address.village) {
        parts.push(address.village);
    }
    
    // State and postcode
    if (address.state) {
        parts.push(address.state);
    }
    if (address.postcode) {
        parts.push(address.postcode);
    }
    
    // Country (if outside India)
    if (address.country && address.country !== 'India') {
        parts.push(address.country);
    }
    
    return parts.join(', ');
}

function handleLocationError(error) {
    console.error('Location error:', error);
    
    // Try to use last known location if available
    const lastLat = localStorage.getItem('lastKnownLat');
    const lastLng = localStorage.getItem('lastKnownLng');
    const lastAddress = localStorage.getItem('lastKnownAddress');
    
    if (lastLat && lastLng) {
        if (lastAddress) {
            locationText.textContent = `Delivering to: ${lastAddress}`;
        } else {
            locationText.textContent = `Near coordinates: ${lastLat}, ${lastLng}`;
        }
        return;
    }
    
    // Specific error messages
    switch(error.code) {
        case error.PERMISSION_DENIED:
            locationText.textContent = 'Location access denied. Using IP-based location.';
            fetchIPBasedLocation();
            break;
        case error.POSITION_UNAVAILABLE:
            locationText.textContent = 'Location information unavailable. Using IP-based location.';
            fetchIPBasedLocation();
            break;
        case error.TIMEOUT:
            locationText.textContent = 'Location request timed out. Using IP-based location.';
            fetchIPBasedLocation();
            break;
        default:
            locationText.textContent = 'Error detecting location. Using IP-based location.';
            fetchIPBasedLocation();
    }
}

function fetchIPBasedLocation() {
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            let locationParts = [];
            
            if (data.city) locationParts.push(data.city);
            if (data.region) locationParts.push(data.region);
            if (data.country_name) locationParts.push(data.country_name);
            
            const location = locationParts.length > 0 ? 
                `Approximate location: ${locationParts.join(', ')}` : 
                'Location unavailable';
                
            locationText.textContent = location;
        })
        .catch(error => {
            console.error('Error getting IP-based location:', error);
            locationText.textContent = 'Precise location unavailable';
        });
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }

}

// Check if user is logged in
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    
    if (token) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Fetch user details
        fetch('http://localhost:3000/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.name) {
                document.getElementById('userName').textContent = data.name;
            }
        })
        .catch(error => {
            console.error('Error fetching user:', error);
        });
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
}


// Logout function
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('token');
    checkAuthStatus();
    window.location.href = 'index.html';
});

// Check auth status on page load
document.addEventListener('DOMContentLoaded', checkAuthStatus);