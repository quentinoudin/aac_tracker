import { useState, useEffect } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Car, Clock, Pencil, Download, FileText } from 'lucide-react';
import { storage } from '../lib/storage';
import { exportTripToPDF, exportAllTripsToPDF, exportTripsToCSV } from '../lib/exporters';
import type { Trip } from '../types/database.types';
import EditTripModal from '../components/EditTripModal';

export default function History() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const loadTrips = () => {
    const loadedTrips = storage.getTrips();
    // Sort descending by start_time
    loadedTrips.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    setTrips(loadedTrips);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleSaveEdit = (updatedTrip: Trip) => {
    storage.updateTrip(updatedTrip);
    setEditingTrip(null);
    loadTrips();
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'En cours...';
    const diff = differenceInMinutes(new Date(end), new Date(start));
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 flex flex-col gap-4 pb-20">
      {trips.length === 0 ? (
        <div className="text-center text-slate-500 mt-20 flex flex-col items-center">
          <Car size={48} className="mb-4 opacity-50" />
          <p>Aucun trajet enregistré</p>
        </div>
      ) : (
        <>
          {/* Export buttons */}
          <div className="sticky top-0 bg-slate-950 z-10 py-4 -mx-4 px-4 border-b border-slate-800 flex gap-2">
            <button
              onClick={() => exportAllTripsToPDF(trips)}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <FileText size={16} />
              PDF tous
            </button>
            <button
              onClick={() => exportTripsToCSV(trips)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <Download size={16} />
              CSV
            </button>
          </div>

          {/* Trips list */}
          {trips.map(trip => (
            <div
              key={trip.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-base capitalize">
                    {format(new Date(trip.start_time), 'EEEE d MMMM yyyy', { locale: fr })}
                  </h3>
                  <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                    <Clock size={14} />
                    {format(new Date(trip.start_time), 'HH:mm')} - {trip.end_time ? format(new Date(trip.end_time), 'HH:mm') : '...'}
                    <span className="font-semibold text-purple-400">{getDuration(trip.start_time, trip.end_time)}</span>
                  </p>
                </div>
                {trip.is_manually_edited && (
                  <span className="px-2 py-1 bg-amber-900/30 text-amber-500 border border-amber-900/50 rounded text-xs font-medium">
                    Édité
                  </span>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-slate-500 text-xs">Véhicule</p>
                  <p className="text-white font-semibold capitalize">{trip.vehicle || '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-slate-500 text-xs">Distance</p>
                  <p className="text-white font-semibold">{trip.distance_km ? `${trip.distance_km.toFixed(1)} km` : '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-slate-500 text-xs">Météo</p>
                  <p className="text-white font-semibold capitalize">{trip.weather || '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-slate-500 text-xs">Trafic</p>
                  <p className="text-white font-semibold capitalize">{trip.traffic || '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded p-2 col-span-2">
                  <p className="text-slate-500 text-xs">Type de route</p>
                  <p className="text-white font-semibold capitalize">{trip.road_type || '-'}</p>
                </div>
                {trip.maneuvers && trip.maneuvers.length > 0 && (
                  <div className="bg-slate-800/50 rounded p-2 col-span-2">
                    <p className="text-slate-500 text-xs mb-1">Manœuvres</p>
                    <div className="flex flex-wrap gap-1">
                      {trip.maneuvers.map(m => (
                        <span key={m} className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {trip.remarks && (
                  <div className="bg-slate-800/50 rounded p-2 col-span-2">
                    <p className="text-slate-500 text-xs mb-1">Remarques</p>
                    <p className="text-slate-300 text-sm">{trip.remarks}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => exportTripToPDF(trip)}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  <Download size={14} />
                  Exporter PDF
                </button>
                <button
                  onClick={() => setEditingTrip(trip)}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                  Éditer
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onSave={handleSaveEdit}
          onCancel={() => setEditingTrip(null)}
        />
      )}
    </div>
  );
}
