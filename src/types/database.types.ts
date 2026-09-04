export type Vehicle = 'leaf' | 'leon' | 'nicolas' | 'autre';
export type Weather = 'Soleil' | 'Pluie' | 'Brouillard' | 'Neige' | 'Nuit';
export type Traffic = 'Fluide' | 'Normal' | 'Dense' | 'Bouchons';
export type RoadType = 'Urbain' | 'Péri-urbain' | 'Campagne' | 'Autoroute' | 'Mixte';

export interface Trip {
  id: string;
  start_time: string; // ISO string
  end_time: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  vehicle: Vehicle;
  weather: Weather | null;
  traffic: Traffic | null;
  road_type: RoadType | null;
  start_label: string | null;
  end_label: string | null;
  maneuvers: string[]; // e.g., ["créneau", "bataille"]
  remarks: string | null;
  distance_km: number | null; // NUMERIC(5,1)
  is_manually_edited: boolean;
}

export interface Database {
  public: {
    Tables: {
      trips: {
        Row: Trip;
        Insert: Omit<Trip, 'id'> & { id?: string };
        Update: Partial<Omit<Trip, 'id'>>;
      };
    };
  };
}
