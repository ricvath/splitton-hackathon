import React, { useState, useEffect } from 'react';
import { fetchWeather } from '@/services/weatherService';
import WeatherLocationPicker from './WeatherLocationPicker';

interface WeatherProps {
  eventName: string;
}

const Weather: React.FC<WeatherProps> = ({ eventName }) => {
  const [weather, setWeather] = useState<{
    temperature: number;
    weatherDescription: string;
    weatherEmoji: string;
    location: string;
  } | null>(null);
  const [isCelsius, setIsCelsius] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState<string | null>(null);

  // Load saved manual location from localStorage on component mount
  useEffect(() => {
    const savedLocation = localStorage.getItem(`weather_location_${eventName}`);
    if (savedLocation) {
      console.log('Loaded saved location from storage:', savedLocation);
      setManualLocation(savedLocation);
    }
  }, [eventName]);

  useEffect(() => {
    const getWeather = async () => {
      setIsLoading(true);
      try {
        const locationToUse = manualLocation || eventName;
        console.log('Weather component fetching for:', locationToUse);
        const weatherData = await fetchWeather(locationToUse);
        console.log('Weather component received:', weatherData);
        setWeather(weatherData);
      } catch (error) {
        console.error('Weather component error:', error);
        setWeather(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventName) {
      getWeather();
    }
  }, [eventName, manualLocation]);

  const handleLocationSelect = (location: string) => {
    console.log('Location selected:', location);
    // Save to localStorage for persistence
    localStorage.setItem(`weather_location_${eventName}`, location);
    setManualLocation(location);
  };

  if (isLoading) {
    return (
      <div className="text-right text-sm text-gray-600 font-medium">
        Loading weather...
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="text-right">
        <div 
          className="text-sm font-medium text-black cursor-pointer hover:opacity-70 transition-opacity"
          onClick={() => setIsLocationPickerOpen(true)}
        >
          Set location
        </div>
      </div>
    );
  }

  const displayTemp = isCelsius 
    ? weather.temperature 
    : Math.round((weather.temperature * 9/5) + 32);

  return (
    <>
      <div className="text-right">
        <div 
          className="text-sm font-medium text-black cursor-pointer hover:opacity-70 transition-opacity"
          onClick={() => setIsLocationPickerOpen(true)}
        >
          {weather.location}
        </div>
        <div className="text-xs text-gray-600 flex items-center justify-end gap-1">
        <span>{weather.weatherEmoji}</span>
            <span className="text-xs font-medium">{displayTemp}º</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCelsius(true);
              }}
              className={`text-xs ${isCelsius ? 'underline' : 'text-gray-400'}`}
            >
              C
            </button>
            <span>/</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCelsius(false);
              }}
              className={`text-xs ${!isCelsius ? 'underline' : 'text-gray-400'}`}
            >
              F
            </button>
          </div>
        </div>
      </div>

      <WeatherLocationPicker
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
};

export default Weather;
