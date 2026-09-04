import { useState } from 'react';
import { Sun, CloudRain, CloudFog, Moon, Snowflake, Check } from 'lucide-react';
import type { Trip, Weather, Traffic, RoadType } from '../types/database.types';

interface EditTripModalProps {
  trip: Trip;
  onSave: (trip: Trip) => void;
  onCancel: () => void;
}

const MANEUVERS = [
  'Créneau G', 'Créneau D', 
  'Bataille AV', 'Bataille AR', 
  'Épi AV', 'Épi AR', 
  'Marche AR', 'Demi-tour', 
  'Arrêt précision'
];

export default function EditTripModal({ trip, onSave, onCancel }: EditTripModalProps) {
  const [weather, setWeather] = useState<Weather | null>(trip.weather);
  const [traffic, setTraffic] = useState<Traffic | null>(trip.traffic);
  const [roadType, setRoadType] = useState<RoadType | null>(trip.road_type || null);
  const [maneuvers, setManeuvers] = useState<string[]>(trip.maneuvers || []);
  const [remarks, setRemarks] = useState(trip.remarks || '');
  
  // Date et heures (simplifiées pour ce prototype, on pourrait utiliser des inputs datetime-local)
  const [startDateStr, setStartDateStr] = useState(
    trip.start_time ? new Date(trip.start_time).toISOString().slice(0, 16) : ''
  );
  const [endDateStr, setEndDateStr] = useState(
    trip.end_time ? new Date(trip.end_time).toISOString().slice(0, 16) : ''
  );

  const toggleManeuver = (m: string) => {
    setManeuvers(prev => 
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const handleSave = () => {
    onSave({
      ...trip,
      weather,
      traffic,
      road_type: roadType,
      maneuvers,
      remarks: remarks.trim() || null,
      start_time: new Date(startDateStr).toISOString(),
      end_time: endDateStr ? new Date(endDateStr).toISOString() : null,
      is_manually_edited: true, // Flag auto
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 flex flex-col gap-6 my-auto">
        <h2 className="text-xl font-bold text-white text-center">Éditer le Trajet</h2>

        {/* Temps */}
        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Départ</label>
            <input 
              type="datetime-local" 
              value={startDateStr}
              onChange={e => setStartDateStr(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Arrivée</label>
            <input 
              type="datetime-local" 
              value={endDateStr}
              onChange={e => setEndDateStr(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
            />
          </div>
        </section>

        {/* Distance & Type Route */}
        <section className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-slate-400 font-medium mb-3 text-sm">Distance (km)</h3>
            <input 
              type="number"
              step="0.1"
              value={trip.distance_km || ''}
              disabled
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <h3 className="text-slate-400 font-medium mb-3 text-sm">Environnement</h3>
            <select
              value={roadType || ''}
              onChange={(e) => setRoadType(e.target.value as RoadType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm appearance-none"
            >
              <option value="" disabled>Sélectionner...</option>
              <option value="Urbain">Urbain</option>
              <option value="Péri-urbain">Péri-urbain</option>
              <option value="Campagne">Campagne</option>
              <option value="Mixte">Mixte</option>
              <option value="Autoroute">Autoroute</option>
            </select>
          </div>
        </section>

        {/* Météo */}
        <section>
          <h3 className="text-slate-400 font-medium mb-3 text-sm">Météo</h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'Soleil', icon: Sun },
              { id: 'Pluie', icon: CloudRain },
              { id: 'Neige', icon: Snowflake },
              { id: 'Brouillard', icon: CloudFog },
              { id: 'Nuit', icon: Moon },
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setWeather(id as Weather)}
                className={`flex flex-col items-center justify-center py-2 rounded-xl border-2 transition-colors ${
                  weather === id 
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400' 
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                <Icon size={20} />
              </button>
            ))}
          </div>
        </section>

        {/* Trafic */}
        <section>
          <h3 className="text-slate-400 font-medium mb-3 text-sm">Trafic</h3>
          <div className="grid grid-cols-2 gap-3">
            {(['Fluide', 'Normal', 'Dense', 'Bouchons'] as Traffic[]).map((t) => (
              <button
                key={t}
                onClick={() => setTraffic(t)}
                className={`py-2 rounded-xl border-2 text-sm font-medium capitalize transition-colors ${
                  traffic === t 
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Manœuvres */}
        <section>
          <h3 className="text-slate-400 font-medium mb-3 text-sm">Manœuvres</h3>
          <div className="grid grid-cols-2 gap-2">
            {MANEUVERS.map((m) => (
              <button
                key={m}
                onClick={() => toggleManeuver(m)}
                className={`py-1.5 px-3 flex items-center justify-between rounded-lg border text-xs transition-colors ${
                  maneuvers.includes(m)
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400'
                }`}
              >
                {m}
                {maneuvers.includes(m) && <Check size={14} />}
              </button>
            ))}
          </div>
        </section>

        {/* Remarques */}
        <section>
          <h3 className="text-slate-400 font-medium mb-3 text-sm">Remarques</h3>
          <textarea 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 h-20 resize-none"
          />
        </section>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 active:bg-slate-700"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] py-3 rounded-xl font-bold text-white bg-purple-600 active:bg-purple-700"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
