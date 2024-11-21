document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const searchButton = document.querySelector('.search');
    const clearButton = document.querySelector('.clear');
    const resultDiv = document.querySelector('.result');
    const isHomePage = window.location.pathname.includes('index.html');

    // Function to fetch and filter data
    async function searchDestinations(searchTerm) {
        try {
            const response = await fetch('travel_recommendation_api.json');
            const data = await response.json();
            let matchedDestinations = [];

            // Convert search term to lowercase for comparison
            const searchLower = searchTerm.toLowerCase().trim();

            // Check for category searches first
            if (searchLower === 'beach' || searchLower === 'beaches') {
                matchedDestinations = data.beaches;
            }
            else if (searchLower === 'temple' || searchLower === 'temples') {
                matchedDestinations = data.temples;
            }
            // If not a category search, perform regular search
            else {
                // Search in countries and their cities
                data.countries.forEach(country => {
                    const matchedCities = country.cities.filter(city =>
                        city.name.toLowerCase().includes(searchLower)
                    ).map(city => ({
                        ...city,
                        timeZone: country.timeZone
                    }));
                    matchedDestinations = matchedDestinations.concat(matchedCities);
                });

                // Search in temples
                const matchedTemples = data.temples.filter(temple =>
                    temple.name.toLowerCase().includes(searchLower)
                );
                matchedDestinations = matchedDestinations.concat(matchedTemples);

                // Search in beaches
                const matchedBeaches = data.beaches.filter(beach =>
                    beach.name.toLowerCase().includes(searchLower)
                );
                matchedDestinations = matchedDestinations.concat(matchedBeaches);
            }

            // Display results
            displayResults(matchedDestinations);
        } catch (error) {
            console.error('Error fetching data:', error);
            resultDiv.innerHTML = '<p>Error loading destinations. Please try again.</p>';
        }
    }

    // Function to display results
    function displayResults(cities) {
        // Make result div visible when displaying results
        resultDiv.style.display = 'grid';

        if (!cities || cities.length === 0) {
            resultDiv.innerHTML = `
                <div class="no-results-message">
                    <p>No destinations found. Please try another search.</p>
                </div>`;
            return;
        }

        const resultsHTML = cities.map(city => {
            // Get current time for the destination
            let timeString = '';
            if (city.timeZone) {
                const options = {
                    timeZone: city.timeZone,
                    hour12: true,
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric'
                };
                try {
                    const localTime = new Date().toLocaleTimeString('en-US', options);
                    timeString = `<p class="local-time">Local Time: ${localTime}</p>`;
                } catch (e) {
                    console.error('Error getting time for timezone:', city.timeZone);
                }
            }

            return `
                <div class="destination-card">
                    <img src="${city.imageUrl}" alt="${city.name}">
                    <h3>${city.name}</h3>
                    ${timeString}
                    <p>${city.description}</p>
                </div>
            `;
        }).join('');

        resultDiv.innerHTML = resultsHTML;
    }

    // Function to handle search from any page
    function handleSearch(searchTerm) {
        if (!isHomePage) {
            // If not on home page, store search term and redirect
            sessionStorage.setItem('pendingSearch', searchTerm);
            window.location.href = 'index.html';
            return;
        }

        // If on home page, perform search
        searchDestinations(searchTerm);
    }

    // Event listeners
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                handleSearch(searchTerm);
            }
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            if (resultDiv) {
                resultDiv.style.display = 'none';
                resultDiv.innerHTML = '';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    handleSearch(searchTerm);
                }
            }
        });
    }

    // Check for pending search when page loads
    if (isHomePage) {
        const pendingSearch = sessionStorage.getItem('pendingSearch');
        if (pendingSearch) {
            searchInput.value = pendingSearch;
            searchDestinations(pendingSearch);
            sessionStorage.removeItem('pendingSearch');
        }
    }
});
