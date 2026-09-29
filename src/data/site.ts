export const site = {
  name: 'Au Platane',
  label: 'Lieu de vie en Ardèche',
  description: 'Un lieu de vie et de partage autour d’une cuisine locale et de saison.',
  email: 'contact@auplatane.com',
  instagramUrl: 'https://www.instagram.com/auplatane_ardeche/',
  phoneDisplay: '07 56 44 49 55',
  phoneRaw: '0756444955',
  reservationApiUrl: import.meta.env.PUBLIC_RESERVATION_API_URL || 'http://127.0.0.1:8787',
  location: '87 route de Largentière, 07110 Montréal',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=87+route+de+Largenti%C3%A8re,+07110+Montr%C3%A9al',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=87+route+de+Largenti%C3%A8re,+07110+Montr%C3%A9al&z=16&output=embed',
  openingHours: [
    { day: 'Lundi', hours: 'Fermé' },
    { day: 'Mardi', hours: 'Fermé' },
    { day: 'Mercredi', hours: '11h - 14h', note: 'Burgers à emporter le soir de 19h à 20h30' },
    { day: 'Jeudi', hours: '11h - 14h' },
    { day: 'Vendredi', hours: '11h - 14h et 17h - 22h' },
    { day: 'Samedi', hours: '11h - 22h' },
    { day: 'Dimanche', hours: '11h - 18h' }
  ],
  serviceHours: 'Le midi de 12h à 13h30 et le soir de 19h à 20h30.',
  spaces: [
    {
      title: 'Restaurant',
      icon: 'fork-knife',
      description: 'Le coeur du lieu, autour d’une cuisine locale et de saison.'
    },
    {
      title: 'Bar',
      icon: 'glass',
      description: 'Un comptoir vivant, du café au verre du soir.'
    },
    {
      title: 'Salon de thé',
      icon: 'cup',
      description: 'Un rythme plus doux pour l’après-midi et les goûters.'
    },
    {
      title: 'Terrasse',
      icon: 'sun',
      description: 'Sous le platane, pour les beaux jours et les soirées.'
    },
    {
      title: 'Epicerie fine locale',
      icon: 'leaf',
      description: 'Une sélection de produits locaux à découvrir sur place.'
    },
    {
      title: 'Glaces',
      icon: 'ice-cream',
      description: 'Des glaces pour les pauses gourmandes et les beaux jours.'
    },
    {
      title: 'Évènements',
      icon: 'spark',
      description: 'Concerts, théâtre, culture, expositions et rendez-vous simples au village.'
    }
  ],
  eventHighlights: ['Concerts', 'Théâtre', 'Culture', 'Expositions', 'Représentations', 'Rencontres']
} as const;
