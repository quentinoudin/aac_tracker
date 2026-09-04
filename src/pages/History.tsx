import { useState, useEffect } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Car, Clock, Pencil } from 'lucide-react';
import { storage } from '../lib/storage';
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
    <div className="p-4 flex flex-col gap-4">
      {trips.length === 0 ? (
        <div className="text-center text-slate-500 mt-20 flex flex-col items-center">
          <Car size={48} className="mb-4 opacity-50" />
          <p>Aucun trajet enregistré</p>
        </div>
      ) : (
        trips.map(trip => (
          <div 
            key={trip.id} 
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg active:scale-[0.99] transition-transform"
            onClick={() => setEditingTrip(trip)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-bold text-lg capitalize">
                  {format(new Date(trip.start_time), 'EEEE d MMMM', { locale: fr })}
                </h3>
                <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                  <Clock size={14} /> 
                  {format(new Date(trip.start_time), 'HH:mm')} - {trip.end_time ? format(new Date(trip.end_time), 'HH:mm') : '...'} 
                  <span className="mx-1">•</span> 
                  <span className="font-semibold text-purple-400">{getDuration(trip.start_time, trip.end_time)}</span>
                </p>
              </div>
              <div className="bg-slate-800 p-2 rounded-full">
                <Pencil size={18} className="text-slate-400" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 font-medium capitalize border border-slate-700 flex items-center gap-1">
                <Car size={12} /> {trip.vehicle}
              </span>
              {trip.weather && (
                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 font-medium capitalize border border-slate-700">
                  {trip.weather}
                </span>
              )}
              {trip.is_manually_edited && (
                <span className="px-2 py-1 bg-amber-900/30 text-amber-500 border border-amber-900/50 rounded text-xs font-medium">
                  Édité
                </span>
              )}
            </div>
          </div>
        ))
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
