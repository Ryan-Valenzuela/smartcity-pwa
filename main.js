// Initial map setup
const map = L.map('map').setView([12.8797, 121.7740], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker;

// Dummy flood hazard zone (rectangle near Manila area)
const floodZones = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        level: 'High',
        name: 'Demo Flood Zone (Sample Only)'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [120.9, 14.5],
            [121.1, 14.5],
            [121.1, 14.8],
            [120.9, 14.8],
            [120.9, 14.5]
          ]
        ]
      }
    }
  ]
};

// Show flood zone on map as overlay so people see the polygon
const floodLayer = L.geoJSON(floodZones, {
  style: {
    color: '#38bdf8',
    weight: 2,
    fillOpacity: 0.2
  }
}).addTo(map);

// Map click handler
map.on('click', function (e) {
  const { lat, lng } = e.latlng;
  setMarkerAndEvaluate(lat, lng, 'Map click');
});

// Helper to place marker and evaluate hazard
function setMarkerAndEvaluate(lat, lng, label) {
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lng]).addTo(map);
  evaluateHazard(lat, lng, label);
}

// Hazard evaluation (simple demo logic)
function evaluateHazard(lat, lng, locationName = 'Selected location') {
  const point = turf.point([lng, lat]);

  let floodResult = 'No flood hazard data here.';
  let floodDetail = 'Point is outside the demo flood polygon.';

  turf.featureEach(floodZones, feature => {
    if (turf.booleanPointInPolygon(point, feature)) {
      floodResult = `Flood hazard: ${feature.properties.level}`;
      floodDetail = `Inside: ${feature.properties.name}. This is only sample data.`;
    }
  });

  updateHazardReport({
    locationName,
    lat,
    lng,
    floodResult,
    floodDetail
  });
}

// Update sidebar report
function updateHazardReport({ locationName, lat, lng, floodResult, floodDetail }) {
  const report = document.getElementById('report');
  report.innerHTML = `
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Coordinates:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
    <hr style="border-color:#1f2933; margin:0.5rem 0;" />
    <p><strong>Flood:</strong> ${floodResult}</p>
    <p>${floodDetail}</p>
    <p style="margin-top:0.5rem; font-size:0.78rem; color:#9ca3af;">
      This is a simplified demo. For official hazard maps, use government tools
      like HazardHunterPH and agency sites.
    </p>
  `;
}

// Search with Nominatim
async function searchLocation(query) {
  if (!query.trim()) return;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&countrycodes=ph&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en'
      }
    });
    const data = await res.json();

    if (data.length === 0) {
      alert('No results found.');
      return;
    }

    const { lat, lon, display_name } = data[0];
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    map.setView([latitude, longitude], 16);
    setMarkerAndEvaluate(latitude, longitude, display_name);
  } catch (err) {
    console.error(err);
    alert('Search failed. Please try again.');
  }
}

// DOM event hookups
document.getElementById('search-btn').addEventListener('click', () => {
  const query = document.getElementById('search-input').value;
  searchLocation(query);
});

document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const query = document.getElementById('search-input').value;
    searchLocation(query);
  }
});

document.getElementById('locate-btn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported in this browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 16);
      setMarkerAndEvaluate(latitude, longitude, 'My location');
    },
    err => {
      console.error(err);
      alert('Could not get your location.');
    }
  );
});

// PWA: register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(err => console.error('Service worker registration failed', err));
  });
}
