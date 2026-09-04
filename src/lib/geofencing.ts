const KNOWN_LOCATIONS = [
  { name: 'Domicile (Génicourt)', lat: 49.0883, lng: 2.0624 }, // Coordonnées approximatives
  { name: 'Chez Louis-Philippe', lat: 49.0000, lng: 2.0000 }, // Remplacer par de vraies valeurs
  { name: "McDonald's Puiseux", lat: 49.0200, lng: 2.0300 }, // Remplacer par de vraies valeurs
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Rayon de la terre en mètres
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

export async function identifyLocation(lat: number, lng: number): Promise<string> {
  // 1. Vérification avec le Geofencing (800m)
  for (const loc of KNOWN_LOCATIONS) {
    const distance = haversineDistance(lat, lng, loc.lat, loc.lng);
    if (distance <= 800) {
      return loc.name;
    }
  }

  // 2. Reverse-Geocoding (Nominatim API) en fallback
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        // Privilégier la ville ou le village
        return data.address.city || data.address.town || data.address.village || data.address.municipality || 'Lieu inconnu';
      }
    }
  } catch (error) {
    console.error('Erreur Reverse Geocoding', error);
  }

  return 'Lieu inconnu';
}
