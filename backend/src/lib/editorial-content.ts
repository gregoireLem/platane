import { z } from 'zod';

export const editorialContentKey = 'editorial';

const menuLineSchema = z.object({
  name: z.string().trim().min(1).max(160),
  price: z.string().trim().max(40).optional().default(''),
  description: z.string().trim().max(600).optional().default('')
});

const menuSectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  items: z.array(menuLineSchema).max(40).default([])
});

const menuFormulaSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.string().trim().max(40).optional().default(''),
  description: z.string().trim().max(600).optional().default('')
});

export const editorialContentSchema = z.object({
  menu: z.object({
    title: z.string().trim().min(1).max(160).default('La cuisine du Platane'),
    period: z.string().trim().max(120).default('L’ardoise du moment'),
    updatedAt: z.string().trim().max(80).default(''),
    intro: z.string().trim().max(1000).default(''),
    formulas: z.array(menuFormulaSchema).max(12).default([]),
    sections: z.array(menuSectionSchema).max(12).default([]),
    notes: z.array(z.string().trim().max(500)).max(10).default([])
  }),
  suggestions: z.object({
    dish: z.string().trim().max(180).default(''),
    drink: z.string().trim().max(180).default(''),
    beer: z.string().trim().max(180).default(''),
    updatedAt: z.string().trim().max(80).default('')
  })
});

export type EditorialContent = z.infer<typeof editorialContentSchema>;

export const defaultEditorialContent: EditorialContent = {
  menu: {
    title: 'La cuisine du Platane',
    period: 'L’ardoise du moment',
    updatedAt: '12 mai 2026',
    intro:
      'Une cuisine simple, locale et faite sur place à partir de produits frais, pensée au rythme des arrivages et du territoire.',
    formulas: [
      {
        name: 'Le midi',
        price: '',
        description:
          'Une formule du jour pensée pour les habitants, artisans, travailleurs du secteur et visiteurs de passage. Entrée + plat + dessert, dans un esprit généreux, simple et fait maison.'
      },
      {
        name: 'Le soir',
        price: '',
        description:
          'Une cuisine conviviale avec des assiettes à partager, quelques tapas, du bon vin et des produits du coin.'
      }
    ],
    sections: [
      {
        title: 'Entrées',
        items: [
          { name: 'Œuf mayonnaise fermier & pickles maison', price: '', description: '' },
          { name: 'Gaspacho de tomates anciennes, basilic & huile verte', price: '', description: '' },
          { name: 'Escargots des Frères Royé en persillade', price: '', description: '6 ou 12 escargots' },
          {
            name: 'Croquette de bœuf bourguignonne',
            price: '',
            description: 'Bœuf mijoté longuement, pané et croustillant, servi avec sauce blanche aux herbes'
          }
        ]
      },
      {
        title: 'Plats',
        items: [
          {
            name: 'Le Burger du Platane',
            price: '',
            description:
              'Steak haché, tomme de vache de Sanhiac « Le Piqueberle », sauce maison, oignons confits & pain artisanal du chef'
          },
          {
            name: 'Burger des Bois',
            price: '',
            description:
              'Champignons MYCA Ardèche rôtis, garniture de saison, tomme de vache de Sanhiac « Le Piqueberle », sauce maison & pain artisanal du chef'
          },
          {
            name: 'Tartare de truite',
            price: '',
            description: 'Truite fraîche assaisonnée, herbes, condiments & fraîcheur du moment'
          },
          {
            name: 'Salade de chèvre chaud',
            price: '',
            description:
              'Chèvre de « Le Piqueberle », miel, noix torréfiées, crudités de saison & vinaigrette aux herbes'
          },
          {
            name: 'Bœuf mijoté au vin rouge',
            price: '',
            description: 'Bœuf mijoté au vin rouge, cuisson lente, légumes et purée de saison'
          }
        ]
      },
      {
        title: 'Desserts',
        items: [
          { name: 'Faisselle & crème de marrons d’Ardèche', price: '', description: '' },
          { name: 'Pavlova aux fruits rouges', price: '', description: '' },
          { name: 'Moelleux à la châtaigne', price: '', description: '' },
          { name: 'Glaces & sorbets artisanaux', price: '', description: '' }
        ]
      },
      {
        title: 'Le soir à partager',
        items: [
          { name: 'Les frites du bistrot & mayonnaise fumée', price: '', description: '' },
          { name: 'Cromesqui de chèvre « Le Piqueberle »', price: '', description: '' },
          { name: 'Planche des salaisons', price: '', description: '' },
          { name: 'Fromages des fermes voisines', price: '', description: '' },
          { name: 'Planche du pays', price: '', description: '' },
          { name: 'Camembert rôti', price: '', description: '' },
          { name: 'Feta rôtie, poivron confit & sauce tomate', price: '', description: '' },
          { name: 'Tartinade du moment', price: '', description: '' }
        ]
      }
    ],
    notes: [
      'La carte fonctionne comme une ardoise : courte, vivante et amenée à évoluer régulièrement selon les arrivages, les producteurs et les envies du moment.',
      'Le midi, une formule du jour ; le soir, des assiettes à partager, quelques tapas, du bon vin et des produits du coin.'
    ]
  },
  suggestions: {
    dish: '',
    drink: '',
    beer: '',
    updatedAt: ''
  }
};

export const normalizeEditorialContent = (value: unknown): EditorialContent => {
  const parsed = editorialContentSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return defaultEditorialContent;
};
