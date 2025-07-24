import { useState, useEffect } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  description: string;
}

interface UseLocationWeatherResult {
  location: LocationData | null;
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
}

export const useLocationWeather = (): UseLocationWeatherResult => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user's location
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          });
        });

        const { latitude, longitude } = position.coords;
        
        // Get location name using reverse geocoding
        try {
          const geocodeResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            setLocation({
              latitude,
              longitude,
              city: geocodeData.city || geocodeData.locality,
              country: geocodeData.countryName
            });
          } else {
            setLocation({ latitude, longitude });
          }
        } catch (geocodeError) {
          console.warn('Geocoding failed, using coordinates only:', geocodeError);
          setLocation({ latitude, longitude });
        }

        // Get weather data using Open-Meteo (free API, no key required)
        try {
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=auto`
          );
          
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            const currentWeather = weatherData.current_weather;
            const currentHumidity = weatherData.hourly.relative_humidity_2m[0] || 50;
            
            // Convert weather codes to descriptions
            const getWeatherDescription = (code: number) => {
              const weatherCodes: Record<number, { condition: string; description: string }> = {
                0: { condition: 'clear', description: 'Clear sky' },
                1: { condition: 'partly_cloudy', description: 'Mainly clear' },
                2: { condition: 'partly_cloudy', description: 'Partly cloudy' },
                3: { condition: 'cloudy', description: 'Overcast' },
                45: { condition: 'foggy', description: 'Fog' },
                48: { condition: 'foggy', description: 'Depositing rime fog' },
                51: { condition: 'drizzle', description: 'Light drizzle' },
                53: { condition: 'drizzle', description: 'Moderate drizzle' },
                55: { condition: 'drizzle', description: 'Dense drizzle' },
                61: { condition: 'rain', description: 'Slight rain' },
                63: { condition: 'rain', description: 'Moderate rain' },
                65: { condition: 'rain', description: 'Heavy rain' },
                71: { condition: 'snow', description: 'Slight snow' },
                73: { condition: 'snow', description: 'Moderate snow' },
                75: { condition: 'snow', description: 'Heavy snow' },
                95: { condition: 'thunderstorm', description: 'Thunderstorm' }
              };
              
              return weatherCodes[code] || { condition: 'unknown', description: 'Unknown weather' };
            };

            const weatherInfo = getWeatherDescription(currentWeather.weathercode);
            
            setWeather({
              temperature: Math.round(currentWeather.temperature),
              humidity: Math.round(currentHumidity),
              condition: weatherInfo.condition,
              description: weatherInfo.description
            });
          }
        } catch (weatherError) {
          console.warn('Weather fetch failed:', weatherError);
          // Continue without weather data
        }

      } catch (err) {
        console.error('Location/Weather error:', err);
        setError(err instanceof Error ? err.message : 'Failed to get location and weather data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationAndWeather();
  }, []);

  return { location, weather, isLoading, error };
};