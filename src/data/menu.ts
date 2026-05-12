export type MenuFormula = {
  name: string;
  price?: string;
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
  title: 'La cuisine du Platane',
  period: 'L’ardoise du moment',
  updatedAt: '12 mai 2026',
  intro:
    'Une cuisine simple, locale et faite sur place à partir de produits frais, pensée au rythme des arrivages et du territoire.',
  formulas: [
    {
      name: 'Le midi',
      description:
        'Une formule du jour pensée pour les habitants, artisans, travailleurs du secteur et visiteurs de passage. Entrée + plat + dessert, dans un esprit généreux, simple et fait maison.'
    },
    {
      name: 'Le soir',
      description:
        'Une cuisine conviviale avec des assiettes à partager, quelques tapas, du bon vin et des produits du coin.'
    }
  ] as MenuFormula[],
  sections: [
    {
      title: 'Entrées',
      items: [
        {
          name: 'Œuf mayonnaise fermier & pickles maison'
        },
        {
          name: 'Gaspacho de tomates anciennes, basilic & huile verte'
        },
        {
          name: 'Escargots des Frères Royé en persillade',
          description: '6 ou 12 escargots'
        }
      ]
    },
    {
      title: 'Plats',
      items: [
        {
          name: 'Le Burger du Platane',
          description:
            'Steak haché, tomme de vache de Sanhiac « Le Piqueberle », sauce maison, oignons confits & pain artisanal du chef'
        },
        {
          name: 'Burger des Bois',
          description:
            'Champignons MYCA Ardèche rôtis, garniture de saison, tomme de vache de Sanhiac « Le Piqueberle », sauce maison & pain artisanal du chef'
        },
        {
          name: 'Tartare de truite',
          description: 'Truite fraîche assaisonnée, herbes, condiments & fraîcheur du moment'
        },
        {
          name: 'Salade de chèvre chaud',
          description:
            'Chèvre de « Le Piqueberle », miel, noix torréfiées, crudités de saison & vinaigrette aux herbes'
        }
      ]
    },
    {
      title: 'Desserts',
      items: [
        {
          name: 'Faisselle & crème de marrons d’Ardèche'
        },
        {
          name: 'Pavlova aux fruits rouges'
        },
        {
          name: 'Moelleux à la châtaigne'
        },
        {
          name: 'Glaces & sorbets artisanaux'
        }
      ]
    },
    {
      title: 'Le soir à partager',
      items: [
        {
          name: 'Les frites du bistrot & mayonnaise fumée'
        },
        {
          name: 'Cromesqui de chèvre « Le Piqueberle »'
        },
        {
          name: 'Planche des salaisons'
        },
        {
          name: 'Fromages des fermes voisines'
        },
        {
          name: 'Planche du pays'
        },
        {
          name: 'Camembert rôti'
        },
        {
          name: 'Feta rôtie, poivron confit & sauce tomate'
        },
        {
          name: 'Tartinade du moment'
        }
      ]
    }
  ] satisfies MenuSection[],
  notes: [
    'La carte fonctionne comme une ardoise : courte, vivante et amenée à évoluer régulièrement selon les arrivages, les producteurs et les envies du moment.',
    'Le midi, une formule du jour ; le soir, des assiettes à partager, quelques tapas, du bon vin et des produits du coin.'
  ]
} as const;
