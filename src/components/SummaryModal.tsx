import { useState, useEffect } from 'react';
import { Sun, CloudRain, CloudFog, Moon, Snowflake, Check, MapPin, Loader2, Route } from 'lucide-react';
import type { Trip, Weather, Traffic, RoadType } from '../types/database.types';
import { calculateRouteDistance, calculateTraffic, calculateRoadType } from '../lib/distanceCalculator';
import { getWeather } from '../lib/weatherService';
import { identifyLocation } from '../lib/geofencing';

interface SummaryModalProps {
  tripData: Partial<Trip>;
  onSave: (trip: Omit<Trip, 'id' | 'is_manually_edited'>) => void;
  onCancel: () => void;
}

const MANEUVERS = [
  'Créneau G', 'Créneau D', 
  'Bataille AV', 'Bataille AR', 
  'Épi AV', 'Épi AR', 
  'Marche AR', 'Demi-tour', 
  'Arrêt précision'
];

export default function SummaryModal({ tripData, onSave, onCancel }: SummaryModalProps) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [traffic, setTraffic] = useState<Traffic | null>(null);
  const [roadType, setRoadType] = useState<RoadType | null>(null);
  const [maneuvers, setManeuvers] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  
  const [startLabel, setStartLabel] = useState<string | null>(null);
  const [endLabel, setEndLabel] = useState<string | null>(null);

  const [isAutoFilling, setIsAutoFilling] = useState(false);

  useEffect(() => {
    async function autoFillData() {
      if (tripData.start_lat && tripData.start_lng && tripData.end_lat && tripData.end_lng && tripData.start_time) {
        setIsAutoFilling(true);
        
        const endTimestampMs = tripData.end_time ? new Date(tripData.end_time).getTime() : Date.now();
        const startTimestampMs = new Date(tripData.start_time).getTime();
        const realTimeSec = (endTimestampMs - startTimestampMs) / 1000;

        const [routeData, weatherData, startLoc, endLoc] = await Promise.all([
          calculateRouteDistance(tripData.start_lat, tripData.start_lng, tripData.end_lat, tripData.end_lng),
          getWeather(tripData.end_lat, tripData.end_lng, endTimestampMs),
          identifyLocation(tripData.start_lat, tripData.start_lng),
          identifyLocation(tripData.end_lat, tripData.end_lng)
        ]);

        if (routeData !== null) {
          setDistanceKm(routeData.distance);
          const deducedTraffic = calculateTraffic(routeData.duration, realTimeSec);
          setTraffic(deducedTraffic);
          
          const deducedRoadType = calculateRoadType(routeData.distance, realTimeSec);
          setRoadType(deducedRoadType);
        }

        if (weatherData !== null) {
          setWeather(weatherData);
        }

        if (startLoc) setStartLabel(startLoc);
        if (endLoc) setEndLabel(endLoc);

        setIsAutoFilling(false);
      }
    }
    autoFillData();
  }, [tripData]);

  const toggleManeuver = (m: string) => {
    setManeuvers(prev => 
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const handleSave = () => {
    onSave({
      ...tripData,
      weather,
      traffic,
      road_type: roadType,
      maneuvers,
      remarks: remarks.trim() || null,
      distance_km: typeof distanceKm === 'number' ? distanceKm : null,
      start_label: startLabel,
      end_label: endLabel,
      start_time: tripData.start_time!,
      end_time: tripData.end_time || new Date().toISOString(),
      start_lat: tripData.start_lat || null,
      start_lng: tripData.start_lng || null,
      end_lat: tripData.end_lat || null,
      end_lng: tripData.end_lng || null,
      vehicle: tripData.vehicle || 'autre',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 flex flex-col gap-6 my-auto relative mt-20 mb-20">
        
        {isAutoFilling && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
            <Loader2 size={48} className="text-purple-500 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">Analyse du trajet...</p>
          </div>
        )}

        <h2 className="text-2xl font-bold text-white text-center">Bilan du Trajet</h2>

        {/* Info Labels */}
        {(startLabel || endLabel) && (
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-sm text-slate-300 flex flex-col gap-1">
            {startLabel && <div><span className="font-semibold text-emerald-400">Départ:</span> {startLabel}</div>}
            {endLabel && <div><span className="font-semibold text-rose-400">Arrivée:</span> {endLabel}</div>}
          </div>
        )}

        {/* Distance & Type Route */}
        <section className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-slate-400 font-medium mb-3 flex items-center gap-2 text-sm">
              <MapPin size={16} /> Distance
            </h3>
            <div className="relative">
              <input 
                type="number"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || '')}
                placeholder="0.0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 pr-10 font-mono text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">km</span>
            </div>
          </div>
          <div>
            <h3 className="text-slate-400 font-medium mb-3 flex items-center gap-2 text-sm">
              <Route size={16} /> Environnement
            </h3>
            <select
              value={roadType || ''}
              onChange={(e) => setRoadType(e.target.value as RoadType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 text-sm appearance-none"
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
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
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
                className={`py-2 rounded-xl border-2 font-medium capitalize transition-colors text-sm ${
                  traffic === t 
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Manœuvres */}
        <section>
          <h3 className="text-slate-400 font-medium mb-3 text-sm">Manœuvres (Optionnel)</h3>
          <div className="grid grid-cols-2 gap-2">
            {MANEUVERS.map((m) => (
              <button
                key={m}
                onClick={() => toggleManeuver(m)}
                className={`py-2 px-3 flex items-center justify-between rounded-lg border text-sm transition-colors ${
                  maneuvers.includes(m)
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {m}
                {maneuvers.includes(m) && <Check size={16} />}
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
            placeholder="Difficultés, points d'attention..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 h-20 resize-none text-sm"
          />
        </section>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl font-bold text-slate-300 bg-slate-800 active:bg-slate-700"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] py-4 rounded-xl font-bold text-white bg-purple-600 active:bg-purple-700"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
