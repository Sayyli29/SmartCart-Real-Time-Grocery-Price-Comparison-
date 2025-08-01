// DOM Elements
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
document.addEventListener('DOMContentLoaded', function () {
    lastUpdatedSpan.textContent = lastUpdated;
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    refreshLocationBtn.addEventListener('click', detectLocation);
    detectLocation(); // Auto-detect location
    checkAuthStatus();
});

// Handle search and fetch from Flask backend
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a product name!');
        return;
    }

    resultsSection.innerHTML = '';
    loadingOverlay.style.display = 'flex';

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/products?product=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.error) {
            resultsSection.innerHTML = `<p class="error">${data.error}</p>`;
        } else {
            displayResults(data);
        }
    } catch (err) {
        console.error('Fetch error:', err);
        resultsSection.innerHTML = `<p class="error">Failed to fetch results. Please try again later.</p>`;
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Function to display product results
function displayResults(data) {
    const resultsSection = document.querySelector(".results");
    resultsSection.innerHTML = ""; // Clear previous results

    const productCard = document.createElement("div");
    productCard.className = "product-card visible";

    // Header
    const productHeader = document.createElement("div");
    productHeader.className = "product-header";
    productHeader.innerHTML = `
        <div class="product-name">${data.product}</div>
        <div class="product-category">Category</div>
    `;

    // Platform links
    const priceComparison = document.createElement("div");
    priceComparison.className = "price-comparison";

    const platforms = data.direct_links || {};

    for (const [platform, link] of Object.entries(platforms)) {
        if (!link) continue;

        const priceItem = document.createElement("div");
        priceItem.className = "price-item";

        priceItem.innerHTML = `
            <div class="price-platform">
                <img src="images/${platform.toLowerCase()}.png" alt="${platform}" style="height:24px;"> 
                <strong>${platform}</strong>
            </div>
            <a class="view-product" href="${link}" target="_blank">Go to ${platform}</a>
        `;

        priceComparison.appendChild(priceItem);
    }

    productCard.appendChild(productHeader);
    productCard.appendChild(priceComparison);
    resultsSection.appendChild(productCard);
}

function renderResults(data) {
    const resultsContainer = document.querySelector('.results');
    resultsContainer.innerHTML = ''; // Clear old

    const productCard = document.createElement('div');
    productCard.classList.add('product-card', 'visible');

    const header = document.createElement('div');
    header.classList.add('product-header');

    header.innerHTML = `
        <div class="product-name">${data.product}</div>
        <div class="product-category">Search Result</div>
    `;

    const priceComparison = document.createElement('div');
    priceComparison.classList.add('price-comparison');

    const platforms = ['Blinkit', 'Zepto', 'Instamart'];
    platforms.forEach(platform => {
        const platformData = data.direct_links[platform];

        const priceItem = document.createElement('div');
        priceItem.classList.add('price-item');

        if (platformData) {
            priceItem.innerHTML = `
                <div class="price-platform">
                    <img src="images/${platform.toLowerCase()}.png" alt="${platform}" style="height:24px; border-radius:50%;">
                    <strong>${platform}</strong>
                </div>
                <div class="price-amount">See Price</div>
                <a href="${platformData.url}" target="_blank" class="view-product">Buy Now</a>
            `;
        } else {
            priceItem.innerHTML = `
                <div class="price-platform">
                    <img src="images/${platform.toLowerCase()}.png" alt="${platform}" style="height:24px; border-radius:50%;">
                    <strong>${platform}</strong>
                </div>
                <div class="price-difference">No product found</div>
            `;
        }

        priceComparison.appendChild(priceItem);
    });

    productCard.appendChild(header);
    productCard.appendChild(priceComparison);
    resultsContainer.appendChild(productCard);
}


// Location functions
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
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        showLoading(false);
        locationText.textContent = 'Geolocation not supported by your browser.';
    }
}

function reverseGeocodeWithFullAddress(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(res => res.json())
        .then(data => {
            const address = data.address;
            const fullAddress = buildFullAddress(address);
            locationText.textContent = `Delivering to: ${fullAddress}`;

            // Save to local storage
            localStorage.setItem('lastKnownLat', lat);
            localStorage.setItem('lastKnownLng', lng);
            localStorage.setItem('lastKnownAddress', fullAddress);
        })
        .catch(err => {
            console.error('Reverse geocoding error:', err);
            locationText.textContent = 'Unable to detect location.';
        })
        .finally(() => {
            showLoading(false);
        });
}

function buildFullAddress(address) {
    if (!address) return 'your location';
    let parts = [];

    if (address.house_number && address.road) {
        parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
        parts.push(address.road);
    }

    if (address.neighbourhood) {
        parts.push(address.neighbourhood);
    } else if (address.suburb) {
        parts.push(address.suburb);
    }

    if (address.city) {
        parts.push(address.city);
    } else if (address.town) {
        parts.push(address.town);
    } else if (address.village) {
        parts.push(address.village);
    }

    if (address.state) parts.push(address.state);
    if (address.postcode) parts.push(address.postcode);
    if (address.country && address.country !== 'India') parts.push(address.country);

    return parts.join(', ');
}

function handleLocationError(error) {
    console.error('Location error:', error);
    const lastLat = localStorage.getItem('lastKnownLat');
    const lastLng = localStorage.getItem('lastKnownLng');
    const lastAddress = localStorage.getItem('lastKnownAddress');

    if (lastLat && lastLng) {
        locationText.textContent = lastAddress
            ? `Delivering to: ${lastAddress}`
            : `Near coordinates: ${lastLat}, ${lastLng}`;
        return;
    }

    switch (error.code) {
        case error.PERMISSION_DENIED:
        case error.POSITION_UNAVAILABLE:
        case error.TIMEOUT:
        default:
            locationText.textContent = 'Using approximate location...';
            fetchIPBasedLocation();
    }
}

function fetchIPBasedLocation() {
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
            let parts = [data.city, data.region, data.country_name].filter(Boolean);
            locationText.textContent = parts.length > 0
                ? `Approximate location: ${parts.join(', ')}`
                : 'Location unavailable';
        })
        .catch(err => {
            console.error('IP location error:', err);
            locationText.textContent = 'Location unavailable';
        });
}

function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Authentication
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');

    if (token) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';

        fetch('http://localhost:3000/api/user', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.name) {
                    document.getElementById('userName').textContent = data.name;
                }
            })
            .catch(err => {
                console.error('User fetch error:', err);
            });
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    checkAuthStatus();
    window.location.href = 'index.html';
});
