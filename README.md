# Nigeria Oil & Gas Infrastructure Visualization

A comprehensive web application that fetches and visualizes oil and gas infrastructure data in Nigeria using Google Maps API. The application displays gas processing plants, crude oil refineries, flow stations, pipelines, liquefaction plants, and CNG mother stations on an interactive map.

## Features

- 🗺️ **Interactive Google Maps Integration** - Visualize infrastructure locations across Nigeria
- 🔍 **Comprehensive Data Fetching** - Search for multiple infrastructure types using Google Places API
- 🎨 **Modern UI/UX** - Beautiful, responsive design with smooth animations
- 🔧 **Advanced Filtering** - Filter facilities by type with real-time updates
- 📊 **Statistics Dashboard** - View total and visible facility counts
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ⚡ **Real-time Updates** - Dynamic data loading and map updates

## Infrastructure Types Covered

- **Gas Processing Plants** 🏭 - Facilities that process natural gas
- **Crude Oil Refineries** ⚡ - Oil refining facilities
- **Flow Stations** 🛢️ - Oil and gas flow control stations
- **Pipelines** 🔗 - Transportation pipeline networks
- **Liquefaction Plants** ❄️ - LNG production facilities
- **CNG Mother Stations** ⛽ - Compressed Natural Gas distribution centers

## Prerequisites

Before running this application, you'll need:

1. **Node.js** (version 14 or higher)
2. **Google Maps API Key** with the following APIs enabled:
   - Places API
   - Maps JavaScript API
   - Geocoding API

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nigeria-oil-gas-infrastructure
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Update Google Maps API Key

Replace `YOUR_GOOGLE_MAPS_API_KEY` in `public/index.html` with your actual API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places"></script>
```

### 5. Start the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### GET /api/infrastructure

Fetches oil and gas infrastructure data from Google Places API.

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": "place_id",
      "name": "Facility Name",
      "address": "Full Address",
      "type": "gas processing plant",
      "location": "Lagos, Nigeria",
      "coordinates": {
        "lat": 6.5244,
        "lng": 3.3792
      },
      "types": ["establishment", "gas_station"],
      "website": "https://example.com",
      "phone": "+234 123 456 7890"
    }
  ]
}
```

## Project Structure

```
├── server.js              # Express server with API endpoints
├── package.json           # Node.js dependencies
├── public/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── script.js         # Frontend JavaScript
└── README.md             # Project documentation
```

## How It Works

1. **Data Fetching**: The server uses Google Places API to search for infrastructure facilities across major Nigerian cities and regions
2. **Data Processing**: Raw API data is processed and enriched with additional details
3. **Visualization**: Facilities are displayed on Google Maps with custom markers and colors
4. **Interactivity**: Users can filter, click markers for details, and view facility information

## Key Technologies

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Maps**: Google Maps JavaScript API, Google Places API
- **Styling**: Custom CSS with modern design patterns
- **HTTP Client**: Axios for API requests

## Customization

### Adding New Infrastructure Types

1. Update the `INFRASTRUCTURE_TYPES` array in `server.js`
2. Add corresponding filter elements in `public/index.html`
3. Update the `infrastructureTypes` object in `public/script.js`
4. Add CSS styles for new type colors

### Modifying Search Locations

Edit the `NIGERIA_LOCATIONS` array in `server.js` to include additional cities or regions.

### Styling Customization

Modify `public/styles.css` to customize colors, fonts, and layout.

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your Google Maps API key is valid and has the required APIs enabled
2. **CORS Issues**: The server includes CORS middleware, but ensure your domain is allowed
3. **Rate Limiting**: The application includes delays between API calls to avoid rate limits
4. **No Data Found**: Some infrastructure types may not be available in Google Places API

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

---

**Note**: This application relies on Google Places API data availability. The accuracy and completeness of the infrastructure data depends on what's available in Google's database for Nigeria.
