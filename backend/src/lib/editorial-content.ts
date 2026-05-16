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
    updatedAt: '',
    intro:
      'Une cuisine simple, locale et faite sur place à partir de produits frais, pensée au rythme des arrivages et du territoire.',
    formulas: [
      {
        name: 'Le midi',
        price: '',
        description: 'Une formule du jour généreuse, simple et faite maison.'
      },
      {
        name: 'Le soir',
        price: '',
        description: 'Des assiettes à partager, du bon vin et des produits du coin.'
      }
    ],
    sections: [
      {
        title: 'Entrées',
        items: [{ name: 'Œuf mayonnaise fermier & pickles maison', price: '', description: '' }]
      },
      {
        title: 'Plats',
        items: [{ name: 'Le Burger du Platane', price: '', description: 'Sauce maison, tomme locale & pain artisanal.' }]
      },
      {
        title: 'Desserts',
        items: [{ name: 'Moelleux à la châtaigne', price: '', description: '' }]
      }
    ],
    notes: [
      'La carte fonctionne comme une ardoise : courte, vivante et amenée à évoluer selon les arrivages.'
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
