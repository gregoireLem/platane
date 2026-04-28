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
  title: 'La carte',
  period: 'Carte du moment',
  updatedAt: '28 avril 2026',
  intro: 'Une cuisine faite sur place, inspirée des saisons et des produits locaux.',
  formulas: [] as MenuFormula[],
  sections: [
    {
      title: 'Entrées',
      items: [
        {
          name: 'Œuf mayo fermier',
          price: '6,50 €',
          description: 'Œuf fermier, mayonnaise du Platane'
        },
        {
          name: 'Croquette de bœuf bourguignonne',
          price: '9 €',
          description: 'Bœuf mijoté longuement, pané et croustillant, servi avec son jus acidulé'
        },
        {
          name: 'Tartare de truite',
          price: '10 €',
          description: 'Truite de Font Rome, garniture de saison'
        },
        {
          name: 'Gaspacho tomate ancienne, fraise et basilic',
          description:
            'Soupe froide estivale, fraîche et parfumée, entre douceur fruitée et acidité légère, huile d’olive ardéchoise'
        }
      ]
    },
    {
      title: 'Salades',
      items: [
        {
          name: 'Poulet du Velay',
          price: '17 €',
          description: 'Poulet IGP, légumes de saison, vinaigrette du Platane'
        },
        {
          name: 'Halloumi grillé',
          price: '16,50 €',
          description: 'Halloumi pané, légumes de saison, vinaigrette du Platane'
        },
        {
          name: 'La raviole',
          price: '16,50 €',
          description: 'Ravioles de Romans, légumes de saison, jus de saison'
        }
      ]
    },
    {
      title: 'Plats',
      items: [
        {
          name: 'Burger du Platane',
          price: '18 €',
          description: 'Recette du moment, garniture de saison, pain artisanal du chef'
        },
        {
          name: 'Bœuf mijoté au vin rouge',
          price: '23 €',
          description: 'Bœuf mijoté au vin rouge, cuisson lente, légumes et purée de saison'
        },
        {
          name: 'Poitrine de porc confite',
          price: '21 €',
          description: 'Porc confit longuement, garniture de saison'
        },
        {
          name: 'Burger des bois',
          price: '18 €',
          description: 'Champignon MYCA Ardèche rôti, garniture de saison, fromage, sauce, pain artisanal du chef'
        }
      ]
    },
    {
      title: 'Desserts',
      items: [
        {
          name: 'Tiramisu du chef',
          price: '6,50 €',
          description: 'Biscuit maison, crème mascarpone'
        },
        {
          name: 'Moelleux à la châtaigne',
          price: '5 €',
          description: 'Gâteau de Sylvie Biscuit & cie, crème anglaise'
        },
        {
          name: 'Faisselle, crème de marron',
          price: '4 €',
          description: 'Faisselle artisanale, crème de marron d’Ardèche'
        },
        {
          name: 'Choux façon profiterole au chocolat',
          price: '7,50 €',
          description: 'Choux garnis, glace, sauce chocolat chaud'
        },
        {
          name: 'Glaces & sorbets',
          price: '3,50 €',
          description: 'Sélection de parfums'
        }
      ]
    },
    {
      title: 'À partager le soir',
      items: [
        {
          name: 'Les frites du bistrot',
          price: '3,50 €'
        },
        {
          name: 'Cromesqui de chèvre “Le Piqueberle”',
          price: '6,50 €'
        },
        {
          name: 'Planche des salaisons',
          price: '16 €'
        },
        {
          name: 'Fromage des fermes voisines',
          price: '15 €'
        },
        {
          name: 'Planche du pays',
          price: '17,50 €'
        },
        {
          name: 'Camembert rôti du terroir',
          price: '10 €'
        },
        {
          name: 'Feta rôtie',
          price: '8 €',
          description: 'Poivron confit, sauce tomate'
        },
        {
          name: 'Tartinade du moment',
          price: '6 €'
        }
      ]
    }
  ] satisfies MenuSection[],
  notes: [
    'La carte évolue selon les saisons et les produits disponibles.',
    'Les plats sont faits sur place avec une attention particulière aux produits locaux.'
  ]
} as const;
