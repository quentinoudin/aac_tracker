import type { Trip } from '../types/database.types';

const TRIPS_KEY = 'aac_trips';
const CURRENT_TRIP_KEY = 'aac_current_trip';

export const storage = {
  getTrips: (): Trip[] => {
    try {
      const data = localStorage.getItem(TRIPS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  
  saveTrip: (trip: Trip) => {
    const trips = storage.getTrips();
    trips.push(trip);
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  },
  
  updateTrip: (updatedTrip: Trip) => {
    const trips = storage.getTrips();
    const index = trips.findIndex(t => t.id === updatedTrip.id);
    if (index !== -1) {
      trips[index] = updatedTrip;
      localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    }
  },
  
  saveCurrentTrip: (tripData: Partial<Trip>) => {
    localStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(tripData));
  },
  
  getCurrentTrip: (): Partial<Trip> | null => {
    try {
      const data = localStorage.getItem(CURRENT_TRIP_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  
  clearCurrentTrip: () => {
    localStorage.removeItem(CURRENT_TRIP_KEY);
  }
};
