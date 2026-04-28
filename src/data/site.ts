export const site = {
  name: 'Au Platane',
  label: 'Lieu de vie en Ardèche',
  description: 'Un lieu de vie et de partage autour d’une cuisine locale et de saison.',
  email: 'contact@platane.com',
  phoneDisplay: '06 89 89 06 50',
  phoneRaw: '0689890650',
  location: '32 chemin des bois, 07110 Montreal',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=32+chemin+des+bois,+07110+Montreal',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=32+chemin+des+bois,+07110+Montreal&z=16&output=embed',
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
    }
  ]
} as const;
