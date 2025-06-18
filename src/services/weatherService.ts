interface WeatherData {
  temperature: number;
  weatherDescription: string;
  weatherEmoji: string;
  location: string;
}

const locationMap: Record<string, { lat: number; lon: number; name: string }> = {
  // Major US cities
  'new york': { lat: 40.7128, lon: -74.0060, name: 'New York' },
  'nyc': { lat: 40.7128, lon: -74.0060, name: 'New York' },
  'boston': { lat: 42.3601, lon: -71.0589, name: 'Boston' },
  'chicago': { lat: 41.8781, lon: -87.6298, name: 'Chicago' },
  'los angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
  'la': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
  'san francisco': { lat: 37.7749, lon: -122.4194, name: 'San Francisco' },
  'miami': { lat: 25.7617, lon: -80.1918, name: 'Miami' },
  'vegas': { lat: 36.1699, lon: -115.1398, name: 'Las Vegas' },
  'las vegas': { lat: 36.1699, lon: -115.1398, name: 'Las Vegas' },
  'seattle': { lat: 47.6062, lon: -122.3321, name: 'Seattle' },
  
  // European cities
  'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
  'london': { lat: 51.5074, lon: -0.1278, name: 'London' },
  'berlin': { lat: 52.5200, lon: 13.4050, name: 'Berlin' },
  'barcelona': { lat: 41.3851, lon: 2.1734, name: 'Barcelona' },
  'rome': { lat: 41.9028, lon: 12.4964, name: 'Rome' },
  'amsterdam': { lat: 52.3676, lon: 4.9041, name: 'Amsterdam' },
  'madrid': { lat: 40.4168, lon: -3.7038, name: 'Madrid' },
  'vienna': { lat: 48.2082, lon: 16.3738, name: 'Vienna' },
  'prague': { lat: 50.0755, lon: 14.4378, name: 'Prague' },
  'budapest': { lat: 47.4979, lon: 19.0402, name: 'Budapest' },
  
  // Middle East and Asia
  'istanbul': { lat: 41.0082, lon: 28.9784, name: 'Istanbul' },
  'dubai': { lat: 25.2048, lon: 55.2708, name: 'Dubai' },
  'ankara': { lat: 39.9334, lon: 32.8597, name: 'Ankara' },
  'izmir': { lat: 38.4237, lon: 27.1428, name: 'Izmir' },
  'antalya': { lat: 36.8969, lon: 30.7133, name: 'Antalya' },
  'cairo': { lat: 30.0444, lon: 31.2357, name: 'Cairo' },
  'tel aviv': { lat: 32.0853, lon: 34.7818, name: 'Tel Aviv' },
  'beirut': { lat: 33.8938, lon: 35.5018, name: 'Beirut' },
  
  // Other popular destinations
  'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  'bangkok': { lat: 13.7563, lon: 100.5018, name: 'Bangkok' },
  'singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
  'sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
  'melbourne': { lat: -37.8136, lon: 144.9631, name: 'Melbourne' },
  'marbella': { lat: 36.5108, lon: -4.8850, name: 'Marbella' },
  'ibiza': { lat: 38.9067, lon: 1.4206, name: 'Ibiza' },
  'mykonos': { lat: 37.4467, lon: 25.3289, name: 'Mykonos' },
  'santorini': { lat: 36.3932, lon: 25.4615, name: 'Santorini' },
  'turkey': { lat: 41.0082, lon: 28.9784, name: 'Istanbul' }, // Country fallback to major city
};

const weatherCodes: Record<number, { description: string; emoji: string }> = {
  0: { description: 'Clear sky', emoji: '☀️' },
  1: { description: 'Mainly clear', emoji: '🌤️' },
  2: { description: 'Partly cloudy', emoji: '⛅' },
  3: { description: 'Overcast', emoji: '☁️' },
  45: { description: 'Foggy', emoji: '🌫️' },
  48: { description: 'Depositing rime fog', emoji: '🌫️' },
  51: { description: 'Light drizzle', emoji: '🌦️' },
  53: { description: 'Moderate drizzle', emoji: '🌦️' },
  55: { description: 'Dense drizzle', emoji: '🌦️' },
  61: { description: 'Slight rain', emoji: '🌧️' },
  63: { description: 'Moderate rain', emoji: '🌧️' },
  65: { description: 'Heavy rain', emoji: '⛈️' },
  71: { description: 'Slight snow', emoji: '❄️' },
  73: { description: 'Moderate snow', emoji: '🌨️' },
  75: { description: 'Heavy snow', emoji: '❄️' },
  80: { description: 'Rain showers', emoji: '🌦️' },
  81: { description: 'Moderate rain showers', emoji: '🌧️' },
  82: { description: 'Violent rain showers', emoji: '⛈️' },
};

export const fetchWeather = async (eventName: string): Promise<WeatherData | null> => {
  try {
    console.log('Fetching weather for event:', eventName);
    
    const eventLower = eventName.toLowerCase();
    let coords = null;
    let locationName = 'Unknown Location';

    // First check for direct matches in the map
    if (locationMap[eventLower]) {
      coords = locationMap[eventLower];
      locationName = coords.name;
      console.log('Direct location match:', eventLower, '→', locationName);
    } else {
      // Then try partial matches
      for (const [city, data] of Object.entries(locationMap)) {
        if (eventLower.includes(city)) {
          coords = data;
          locationName = data.name;
          console.log('Partial location match:', city, '→', locationName);
          break;
        }
      }
      
      // For manual input, try to match with comma separation (e.g., "Istanbul, Turkey")
      if (!coords && eventLower.includes(',')) {
        const parts = eventLower.split(',').map(part => part.trim());
        for (const part of parts) {
          if (locationMap[part]) {
            coords = locationMap[part];
            locationName = coords.name;
            console.log('Manual location match from parts:', part, '→', locationName);
            break;
          }
        }
      }
    }

    // Default to New York if no location found
    if (!coords) {
      coords = locationMap['new york'];
      locationName = 'New York';
      console.log('No location found, defaulting to:', locationName);
    }

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=auto`;
    console.log('Fetching from API:', apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Weather API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Weather API response:', data);
    
    const currentWeather = data.current_weather;

    if (!currentWeather) {
      throw new Error('No current weather data in response');
    }

    const weatherInfo = weatherCodes[currentWeather.weathercode] || { 
      description: 'Unknown', 
      emoji: '🌤️' 
    };

    const result = {
      temperature: Math.round(currentWeather.temperature),
      weatherDescription: weatherInfo.description,
      weatherEmoji: weatherInfo.emoji,
      location: locationName
    };

    console.log('Returning weather data:', result);
    return result;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};
