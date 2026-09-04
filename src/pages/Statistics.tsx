import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { storage } from '../lib/storage';
import type { Trip } from '../types/database.types';

export default function Statistics() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const GOAL_KM = 3000;

  useEffect(() => {
    setTrips(storage.getTrips());
  }, []);

  const totalKm = trips.reduce((acc, trip) => acc + (trip.distance_km || 0), 0);
  const progressPercent = Math.min((totalKm / GOAL_KM) * 100, 100);

  // Distribution des routes
  const roadDistribution = trips.reduce((acc, trip) => {
    if (trip.road_type && trip.distance_km) {
      acc[trip.road_type] = (acc[trip.road_type] || 0) + trip.distance_km;
    }
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(roadDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899']; // Ajout de couleurs pour Péri-urbain et Mixte

  // Parcours fréquents
  const frequentTripsData = trips.reduce((acc, trip) => {
    if (trip.start_label && trip.end_label && trip.distance_km) {
      const key = `${trip.start_label} ➔ ${trip.end_label}`;
      if (!acc[key]) acc[key] = { count: 0, distance: 0 };
      acc[key].count += 1;
      acc[key].distance += trip.distance_km;
    }
    return acc;
  }, {} as Record<string, { count: number, distance: number }>);

  const frequentTripsArray = Object.entries(frequentTripsData)
    .map(([route, data]) => ({ route, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto w-full max-w-md mx-auto mb-20">
      <h2 className="text-2xl font-bold text-white mb-6">Statistiques</h2>

      {/* Jauge 3000km */}
      <section className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl mb-6 flex flex-col items-center">
        <h3 className="text-slate-400 font-medium mb-4">Progression Globale</h3>
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
            <circle 
              cx="96" cy="96" r="80" 
              stroke="currentColor" 
              strokeWidth="12" 
              fill="transparent" 
              strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={2 * Math.PI * 80 * (1 - progressPercent / 100)}
              className="text-emerald-500 transition-all duration-1000 ease-out" 
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{totalKm.toFixed(1)}</span>
            <span className="text-slate-500 text-sm">/ {GOAL_KM} km</span>
          </div>
        </div>
      </section>

      {/* Répartition Routes */}
      {pieData.length > 0 && (
        <section className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl mb-6">
          <h3 className="text-slate-400 font-medium mb-4">Répartition des Routes</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toFixed(1)} km`, 'Distance']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Parcours Récurrents */}
      {frequentTripsArray.length > 0 && (
        <section className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl mb-6">
          <h3 className="text-slate-400 font-medium mb-4">Parcours Réguliers</h3>
          <div className="flex flex-col gap-3">
            {frequentTripsArray.map((item, idx) => (
              <div key={idx} className="bg-slate-800 p-3 rounded-lg flex items-center justify-between border border-slate-700">
                <div className="flex flex-col flex-1 truncate pr-4">
                  <span className="text-white font-medium text-sm truncate" title={item.route}>{item.route}</span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-purple-400 font-bold">{item.count} fois</span>
                  <span className="text-slate-500 text-xs">{item.distance.toFixed(1)} km</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
