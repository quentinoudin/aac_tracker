import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Square, BellRing } from 'lucide-react';
import { storage } from '../lib/storage';
import SummaryModal from '../components/SummaryModal';
import { sendToWebhook } from '../lib/webhook';
import type { Trip, Vehicle } from '../types/database.types';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const carParam = searchParams.get('car') as Vehicle | null;
  
  const [isTracking, setIsTracking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTrip, setCurrentTrip] = useState<Partial<Trip> | null>(null);
  const reminderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Check if there's an ongoing trip in localStorage
    const ongoing = storage.getCurrentTrip();
    if (ongoing && ongoing.start_time) {
      setCurrentTrip(ongoing);
      setIsTracking(true);
      
      // Calculate elapsed time
      const start = new Date(ongoing.start_time).getTime();
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
      scheduleReminder(start);
    } else if (carParam) {
      setCurrentTrip({ vehicle: ['leaf', 'leon', 'autre'].includes(carParam) ? carParam : 'autre' });
    }
  }, [carParam]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const scheduleReminder = (startTimeMs: number) => {
    if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);
    
    // 90 minutes = 90 * 60 * 1000 = 5400000 ms
    const timeUntil90Min = 5400000 - (Date.now() - startTimeMs);
    
    if (timeUntil90Min > 0) {
      reminderTimeoutRef.current = setTimeout(() => {
        triggerLocalNotification("Trajet en cours : N'oublie pas de scanner le tag à l'arrivée !");
      }, timeUntil90Min);
    }
  };

  const triggerLocalNotification = async (title: string, body?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        });
      } catch (e) {
        // Fallback if Service Worker is not ready
        new Notification(title, { body, icon: '/icon-192x192.png' });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    const startTimeStr = new Date().toISOString();
    const newTrip: Partial<Trip> = {
      ...currentTrip,
      start_time: startTimeStr,
      vehicle: currentTrip?.vehicle || 'autre',
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          newTrip.start_lat = position.coords.latitude;
          newTrip.start_lng = position.coords.longitude;
          finishStart(newTrip);
        },
        () => finishStart(newTrip),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      finishStart(newTrip);
    }
  };

  const finishStart = (tripData: Partial<Trip>) => {
    storage.saveCurrentTrip(tripData);
    setCurrentTrip(tripData);
    setIsTracking(true);
    setElapsedTime(0);
    scheduleReminder(new Date(tripData.start_time!).getTime());
  };

  const handleStop = () => {
    if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);
    setIsTracking(false);
    
    const endData = { ...currentTrip, end_time: new Date().toISOString() };
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          endData.end_lat = position.coords.latitude;
          endData.end_lng = position.coords.longitude;
          setCurrentTrip(endData);
          setShowSummary(true);
        },
        () => {
          setCurrentTrip(endData);
          setShowSummary(true);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      setCurrentTrip(endData);
      setShowSummary(true);
    }
  };

  const handleSaveTrip = async (tripDetails: Omit<Trip, 'id' | 'is_manually_edited'>) => {
    const newTrip: Trip = {
      ...tripDetails,
      id: crypto.randomUUID(),
      is_manually_edited: false
    };
    
    storage.saveTrip(newTrip);
    storage.clearCurrentTrip();
    setCurrentTrip(null);
    setShowSummary(false);
    setElapsedTime(0);

    // Export Webhook
    await sendToWebhook(newTrip);

    // Notification Succès
    triggerLocalNotification(`Trajet enregistré avec succès`, `Distance: ${newTrip.distance_km !== null ? newTrip.distance_km + ' km' : 'Inconnue'}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 h-full relative">
      <button 
        onClick={requestNotificationPermission}
        className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 transition-colors"
        title="Activer les notifications"
      >
        <BellRing size={20} />
      </button>

      {!isTracking ? (
        <button
          onClick={handleStart}
          className="w-64 h-64 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-[0_0_40px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center gap-4 transition-transform active:scale-95"
        >
          <Play size={64} className="text-emerald-950 ml-4" />
          <span className="text-2xl font-black tracking-tight text-emerald-950 uppercase">Démarrer</span>
        </button>
      ) : (
        <div className="flex flex-col items-center w-full max-w-sm gap-12">
          <div className="text-7xl font-mono font-light tracking-tighter text-white tabular-nums drop-shadow-md">
            {formatTime(elapsedTime)}
          </div>
          
          <button
            onClick={handleStop}
            className="w-full h-32 rounded-3xl bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center justify-center gap-4 transition-transform active:scale-[0.98]"
          >
            <Square size={36} className="text-white fill-white" />
            <span className="text-3xl font-black text-white uppercase">Terminer</span>
          </button>
        </div>
      )}

      {showSummary && currentTrip && (
        <SummaryModal 
          tripData={currentTrip} 
          onSave={handleSaveTrip} 
          onCancel={() => setShowSummary(false)} 
        />
      )}
    </div>
  );
}
