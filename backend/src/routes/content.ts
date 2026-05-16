import { Router } from 'express';
import { prisma } from '../db.js';
import {
  defaultEditorialContent,
  editorialContentKey,
  normalizeEditorialContent
} from '../lib/editorial-content.js';

export const contentRouter = Router();

contentRouter.get('/editorial', async (_req, res, next) => {
  try {
    const [content, events, gallery] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: editorialContentKey } }),
      prisma.bistroEvent.findMany({
        where: { isPublished: true },
        orderBy: [{ eventDate: 'asc' }, { createdAt: 'asc' }],
        take: 12
      }),
      prisma.galleryPhoto.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 24
      })
    ]);

    res.json({
      ...(normalizeEditorialContent(content?.value ?? defaultEditorialContent)),
      events,
      gallery
    });
  } catch (error) {
    next(error);
  }
});
