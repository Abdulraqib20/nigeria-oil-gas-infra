const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Google Maps API key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Nigeria oil and gas infrastructure search terms
const INFRASTRUCTURE_TYPES = [
    'gas processing plant',
    'crude oil refinery',
    'flow station',
    'pipeline',
    'liquefaction plant',
    'CNG mother station'
];

// Nigeria major cities and regions for comprehensive search
const NIGERIA_LOCATIONS = [
    'Lagos, Nigeria',
    'Port Harcourt, Nigeria',
    'Warri, Nigeria',
    'Kaduna, Nigeria',
    'Calabar, Nigeria',
    'Bonny, Nigeria',
    'Escravos, Nigeria',
    'Forcados, Nigeria',
    'Brass, Nigeria',
    'Qua Iboe, Nigeria'
];

// Function to search for places using Google Places API
async function searchPlaces(query, location) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
            params: {
                query: `${query} ${location}`,
                key: GOOGLE_MAPS_API_KEY,
                type: 'establishment'
            }
        });

        return response.data.results || [];
    } catch (error) {
        console.error(`Error searching for ${query} in ${location}:`, error.message);
        return [];
    }
}

// Function to get place details
async function getPlaceDetails(placeId) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
                place_id: placeId,
                key: GOOGLE_MAPS_API_KEY,
                fields: 'name,formatted_address,geometry,types,website,formatted_phone_number'
            }
        });

        return response.data.result || null;
    } catch (error) {
        console.error(`Error getting details for place ${placeId}:`, error.message);
        return null;
    }
}

// API endpoint to fetch oil and gas infrastructure
app.get('/api/infrastructure', async (req, res) => {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            return res.status(500).json({
                error: 'Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in your environment variables.'
            });
        }

        const allInfrastructure = [];

        // Search for each infrastructure type in each location
        for (const infrastructureType of INFRASTRUCTURE_TYPES) {
            for (const location of NIGERIA_LOCATIONS) {
                console.log(`Searching for ${infrastructureType} in ${location}...`);

                const places = await searchPlaces(infrastructureType, location);

                for (const place of places) {
                    // Get detailed information for each place
                    const details = await getPlaceDetails(place.place_id);

                    if (details) {
                        allInfrastructure.push({
                            id: place.place_id,
                            name: details.name,
                            address: details.formatted_address,
                            type: infrastructureType,
                            location: location,
                            coordinates: {
                                lat: details.geometry?.location?.lat,
                                lng: details.geometry?.location?.lng
                            },
                            types: details.types,
                            website: details.website,
                            phone: details.formatted_phone_number
                        });
                    }
                }

                // Add delay to avoid hitting API rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Remove duplicates based on place_id
        const uniqueInfrastructure = allInfrastructure.filter((item, index, self) =>
            index === self.findIndex(t => t.id === item.id)
        );

        res.json({
            success: true,
            count: uniqueInfrastructure.length,
            data: uniqueInfrastructure
        });

    } catch (error) {
        console.error('Error fetching infrastructure data:', error);
        res.status(500).json({
            error: 'Failed to fetch infrastructure data',
            details: error.message
        });
    }
});

// API endpoint to provide Google Maps API key
app.get('/api/config', (req, res) => {
    if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({
            error: 'Google Maps API key not configured'
        });
    }

    res.json({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to set your GOOGLE_MAPS_API_KEY in the environment variables');
});
