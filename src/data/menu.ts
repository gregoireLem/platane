export type MenuFormula = {
  name: string;
  price: string;
  description: string;
};

export type MenuItem = {
  name: string;
  price?: string;
  description?: string;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export const weeklyMenu = {
  title: 'Menu du moment',
  period: 'Semaine en cours',
  updatedAt: '24 avril 2026',
  intro: 'Une carte courte, de saison, pensée pour évoluer facilement.',
  formulas: [
    {
      name: 'Formule déjeuner',
      price: '24 €',
      description: 'Entrée, plat, dessert. Disponible le midi selon le marché.'
    },
    {
      name: 'Assiette à partager',
      price: '19 €',
      description: 'Sélection de bouchées salées, pain de campagne et condiments maison.'
    },
    {
      name: 'Pause salon de thé',
      price: '8 €',
      description: 'Boisson chaude et douceur du jour.'
    }
  ] satisfies MenuFormula[],
  sections: [
    {
      title: 'Entrées',
      items: [
        {
          name: 'Oeufs mimosa',
          price: '8 €',
          description: 'Paprika fumé et herbes fraîches'
        },
        {
          name: 'Velouté de légumes de saison',
          price: '9 €',
          description: 'Huile d’olive et croûtons dorés'
        },
        {
          name: 'Chèvre frais',
          price: '10 €',
          description: 'Pickles et salade croquante'
        }
      ]
    },
    {
      title: 'Plats',
      items: [
        {
          name: 'Volaille rôtie',
          price: '18 €',
          description: 'Jus réduit et pommes grenaille'
        },
        {
          name: 'Poisson du moment',
          price: '21 €',
          description: 'Légumes braisés et beurre citronné'
        },
        {
          name: 'Assiette végétale',
          price: '17 €',
          description: 'Céréales, légumes rôtis et sauce aux herbes'
        }
      ]
    },
    {
      title: 'Desserts',
      items: [
        {
          name: 'Tarte fine',
          price: '8 €',
          description: 'Fruits du jour'
        },
        {
          name: 'Crème vanillée',
          price: '7 €',
          description: 'Éclats de noix'
        },
        {
          name: 'Moelleux chocolat',
          price: '8 €',
          description: 'Pointe de sel'
        }
      ]
    },
    {
      title: 'À boire',
      items: [
        {
          name: 'Vins au verre',
          description: 'Sélection du moment'
        },
        {
          name: 'Bières artisanales',
          description: 'Et boissons fraîches'
        },
        {
          name: 'Thés, infusions, café',
          description: 'À toute heure'
        }
      ]
    }
  ] satisfies MenuSection[],
  notes: [
    'La carte évolue selon la semaine et les produits disponibles.',
    'Le menu peut être mis à jour simplement, sans modifier le site.'
  ]
} as const;
