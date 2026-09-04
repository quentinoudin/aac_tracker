import type { Traffic, RoadType } from '../types/database.types';

export async function calculateRouteDistance(latA: number, lngA: number, latB: number, lngB: number): Promise<{ distance: number, duration: number } | null> {
  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${lngA},${latA};${lngB},${latB}?overview=false`);
    
    if (!response.ok) {
      console.error('Erreur API OSRM', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const distanceInMeters = data.routes[0].distance;
      const durationInSeconds = data.routes[0].duration;
      return {
        distance: Math.round((distanceInMeters / 1000) * 10) / 10,
        duration: durationInSeconds
      };
    }

    return null;
  } catch (error) {
    console.error('Erreur réseau OSRM', error);
    return null;
  }
}

export function calculateTraffic(theoreticalTime: number, realTime: number): Traffic {
  // Pénalité Apprenti (Conduite Accompagnée)
  const adjustedTheoreticalTime = theoreticalTime * 1.15;

  if (realTime <= adjustedTheoreticalTime * 1.10) {
    return 'Fluide';
  } else if (realTime <= adjustedTheoreticalTime * 1.30) {
    return 'Normal';
  } else if (realTime <= adjustedTheoreticalTime * 1.50) {
    return 'Dense';
  } else {
    return 'Bouchons';
  }
}

export function calculateRoadType(distanceKm: number, realTimeSeconds: number): RoadType {
  if (distanceKm <= 0 || realTimeSeconds <= 0) return 'Urbain';
  
  const speedKmh = distanceKm / (realTimeSeconds / 3600);
  
  if (speedKmh >= 80) {
    return 'Autoroute';
  } else if (speedKmh >= 50) {
    return 'Campagne';
  } else {
    return 'Urbain';
  }
}
