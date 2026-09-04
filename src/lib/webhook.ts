import type { Trip } from '../types/database.types';

export async function sendToWebhook(trip: Trip) {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('Webhook URL not configured');
    return;
  }

  const durationMs = new Date(trip.end_time || '').getTime() - new Date(trip.start_time).getTime();
  const minutes = Math.floor(durationMs / 60000);
  
  const payload = {
    content: `🚗 **Nouveau trajet AAC clôturé**
📍 **Départ :** ${new Date(trip.start_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
🏁 **Arrivée :** ${trip.end_time ? new Date(trip.end_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
⏱️ **Durée :** ${minutes} min
📏 **Distance :** ${trip.distance_km !== null ? trip.distance_km + ' km' : 'Non précisée'}
🌦️ **Météo :** ${trip.weather || 'Non précisée'}
🚦 **Trafic :** ${trip.traffic || 'Non précisé'}
⚙️ **Manœuvres :** ${trip.maneuvers.length > 0 ? trip.maneuvers.join(', ') : 'Aucune'}
📝 **Remarques :** ${trip.remarks || 'Aucune'}
    `
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send webhook', error);
  }
}
