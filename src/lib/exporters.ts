// @ts-ignore
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Trip } from '../types/database.types';

export function formatDuration(start: string | undefined, end: string | null | undefined): string {
  if (!start || !end) return 'En cours...';
  const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60));
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export function exportTripToPDF(trip: Trip): void {
  const doc = new jsPDF();

  const startStr = trip.start_time ? String(trip.start_time) : '';
  const endStr = trip.end_time ? String(trip.end_time) : null;

  const dateStr = startStr ? format(new Date(startStr), 'd MMMM yyyy', { locale: fr }) : '';
  const startTime = startStr ? format(new Date(startStr), 'HH:mm', { locale: fr }) : '';
  const endTime = endStr ? format(new Date(endStr), 'HH:mm', { locale: fr }) : '-';
  const duration = formatDuration(startStr, endStr);

  // Header
  doc.setFontSize(16);
  doc.text('Fiche de Trajet', 105, 20, { align: 'center' });

  // Content
  doc.setFontSize(11);
  let yPos = 40;
  const lineHeight = 8;

  const data: [string, string][] = [
    ['Date', dateStr],
    ['Heure Départ', startTime],
    ['Heure Arrivée', endTime],
    ['Durée', duration],
    ['Véhicule', trip.vehicle || '-'],
    ['Distance', trip.distance_km ? `${trip.distance_km.toFixed(1)} km` : '-'],
    ['Météo', trip.weather || '-'],
    ['Trafic', trip.traffic || '-'],
    ['Type de Route', trip.road_type || '-'],
    ['Manœuvres', trip.maneuvers?.join(', ') || '-'],
    ['Remarques', trip.remarks || '-'],
  ];

  data.forEach(([key, value]) => {
    // @ts-ignore
    doc.setFont(undefined, 'bold');
    // @ts-ignore
    doc.text(`${key}:`, 20, yPos);
    // @ts-ignore
    doc.setFont(undefined, 'normal');

    const wrappedText = doc.splitTextToSize(value, 150) as any;
    doc.text(wrappedText, 60, yPos);
    yPos += wrappedText.length * lineHeight + 4;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 280, { align: 'center' });

  // Save
  const filename = startStr ? `trajet_${format(new Date(startStr), 'yyyy-MM-dd_HH-mm')}.pdf` : 'trajet.pdf';
  doc.save(filename);
}

export function exportAllTripsToPDF(trips: Trip[]): void {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Carnet AAC - Tous les Trajets', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  let yPos = 35;
  const pageHeight = doc.internal.pageSize.height;
  const lineHeight = 6;

  trips.forEach((trip, index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    const startStr = trip.start_time ? String(trip.start_time) : '';
    const endStr = trip.end_time ? String(trip.end_time) : null;

    const dateStr = startStr ? format(new Date(startStr), 'd MMM yyyy', { locale: fr }) : '';
    const startTime = startStr ? format(new Date(startStr), 'HH:mm') : '';
    const endTime = endStr ? format(new Date(endStr), 'HH:mm') : '-';
    const duration = formatDuration(startStr, endStr);

    // Trip header
    // @ts-ignore
    doc.setFont(undefined, 'bold');
    // @ts-ignore
    doc.text(`${index + 1}. ${dateStr}`, 20, yPos);
    yPos += lineHeight;

    // Trip details
    // @ts-ignore
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    const tripInfo = [
      `${startTime} → ${endTime} (${duration}) | ${trip.vehicle || '-'} | ${trip.distance_km ? trip.distance_km.toFixed(1) : '-'} km`,
      `Météo: ${trip.weather || '-'} | Trafic: ${trip.traffic || '-'} | Route: ${trip.road_type || '-'}`,
    ];

    tripInfo.forEach(line => {
      doc.text(line, 25, yPos);
      yPos += lineHeight;
    });

    yPos += 2;
  });

  // Footer with summary
  doc.setFontSize(9);
  doc.setTextColor(100);
  const totalKm = trips.reduce((sum, t) => sum + (t.distance_km || 0), 0).toFixed(1);
  const totalTrips = trips.length;
  doc.text(`Total: ${totalTrips} trajet(s) | ${totalKm} km`, 20, pageHeight - 10);

  doc.save(`carnet-aac_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportTripsToCSV(trips: Trip[]): void {
  const headers = [
    'Date',
    'Heure Départ',
    'Heure Arrivée',
    'Durée',
    'Véhicule',
    'Distance (km)',
    'Météo',
    'Trafic',
    'Type de Route',
    'Manœuvres',
    'Remarques',
    'Édité',
  ];

  const rows = trips.map(trip => {
    const startStr = trip.start_time ? String(trip.start_time) : '';
    const endStr = trip.end_time ? String(trip.end_time) : null;

    return [
      startStr ? format(new Date(startStr), 'dd/MM/yyyy', { locale: fr }) : '',
      startStr ? format(new Date(startStr), 'HH:mm') : '',
      endStr ? format(new Date(endStr), 'HH:mm') : '-',
      formatDuration(startStr, endStr),
      trip.vehicle || '-',
      trip.distance_km ? trip.distance_km.toFixed(1) : '-',
      trip.weather || '-',
      trip.traffic || '-',
      trip.road_type || '-',
      trip.maneuvers?.join('; ') || '-',
      trip.remarks || '-',
      trip.is_manually_edited ? 'Oui' : 'Non',
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `carnet-aac_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
