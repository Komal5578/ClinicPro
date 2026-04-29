const https = require('https');

/**
 * Geocode address to latitude/longitude using Nominatim (OpenStreetMap)
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
const geocodeAddress = async (address) => {
  if (!address || address.trim().length === 0) {
    return null;
  }

  return new Promise((resolve) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

    const req = https.get(url, { headers: { 'User-Agent': 'ClinicPro/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results && results.length > 0) {
            const { lat, lon } = results[0];
            resolve({ lat: parseFloat(lat), lng: parseFloat(lon) });
          } else {
            resolve(null);
          }
        } catch (err) {
          console.error('Geocoding parse error:', err.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Geocoding request error:', err.message);
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
};

module.exports = { geocodeAddress };
