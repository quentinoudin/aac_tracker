import type { Weather } from '../types/database.types';

export async function getWeather(lat: number, lng: number, endTimestampMs: number): Promise<Weather | null> {
  const apiKey = import.meta.env.VITE_OWM_API_KEY;
  if (!apiKey) {
    console.warn('Clé API OpenWeatherMap manquante');
    return null;
  }

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=fr`);
    
    if (!response.ok) {
      console.error('Erreur API OpenWeatherMap', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data && data.weather && data.weather.length > 0) {
      const conditionId = data.weather[0].id;
      const sunset = data.sys.sunset * 1000;
      const sunrise = data.sys.sunrise * 1000;
      
      // Si on est de nuit
      if (endTimestampMs < sunrise || endTimestampMs > sunset) {
        return 'Nuit';
      }

      // Mapping ID
      if (conditionId >= 200 && conditionId < 600) {
        return 'Pluie';
      } else if (conditionId >= 600 && conditionId < 700) {
        return 'Neige';
      } else if (conditionId >= 700 && conditionId < 800) {
        return 'Brouillard';
      } else if (conditionId >= 800 && conditionId < 900) {
        return 'Soleil';
      }
    }

    return null;
  } catch (error) {
    console.error('Erreur réseau OWM', error);
    return null;
  }
}
