import { ReservationStatus } from '@prisma/client';
import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { prisma } from '../db.js';
import {
  defaultEditorialContent,
  editorialContentKey,
  editorialContentSchema,
  normalizeEditorialContent
} from '../lib/editorial-content.js';
import {
  getServiceAvailability,
  getDefaultCapacity,
  getDefaultHours,
  normalizeReservationDate,
  normalizeService,
  serviceLabel
} from '../lib/reservations.js';

const adminSessionCookie = 'au_platane_admin_session';
const sessionMaxAgeMs = 12 * 60 * 60 * 1000;

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

const imageUrlSchema = z
  .string()
  .trim()
  .max(2_500_000)
  .refine((value) => !value || value.startsWith('data:image/') || /^https?:\/\//.test(value), {
    message: 'Image invalide'
  })
  .optional()
  .or(z.literal(''));

const eventSchema = z.object({
  title: z.string().trim().min(2).max(160),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventTime: z.string().trim().max(20).optional().or(z.literal('')),
  summary: z.string().trim().min(2).max(500),
  details: z.string().trim().max(1500).optional().or(z.literal('')),
  imageUrl: imageUrlSchema,
  ctaLabel: z.string().trim().max(80).optional().or(z.literal('')),
  ctaUrl: z.string().trim().max(500).optional().or(z.literal('')),
  isPublished: z.boolean().optional().default(true)
});

const galleryPhotoSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
  alt: z.string().trim().max(240).optional().or(z.literal('')),
  imageUrl: imageUrlSchema.refine((value) => !!value, { message: 'Image requise' }),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isPublished: z.boolean().optional().default(true)
});

const listReservationsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  service: z.enum(['midi', 'soir']).optional(),
  status: z.nativeEnum(ReservationStatus).optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(ReservationStatus),
  notes: z.string().trim().max(1000).optional()
});

const createAdminReservationSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().trim().email().optional().or(z.literal('')),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/),
  service: z.enum(['midi', 'soir']),
  partySize: z.coerce.number().int().positive().max(20),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  source: z.string().trim().min(2).max(40).optional().default('telephone'),
  status: z.nativeEnum(ReservationStatus).default(ReservationStatus.CONFIRMED)
});

const upsertCapacitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service: z.enum(['midi', 'soir']),
  capacity: z.coerce.number().int().positive().max(500),
  isClosed: z.boolean().optional().default(false),
  note: z.string().trim().max(1000).optional()
});

const upsertScheduleSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  service: z.enum(['midi', 'soir']),
  capacity: z.coerce.number().int().positive().max(500),
  isClosed: z.boolean().optional().default(false),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  note: z.string().trim().max(1000).optional().or(z.literal(''))
});

export const adminRouter = Router();

const safeCompare = (value: string, expected: string) => {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(valueBuffer, expectedBuffer)
  );
};

const signSessionPayload = (payload: string) =>
  crypto.createHmac('sha256', config.ADMIN_SESSION_SECRET).update(payload).digest('base64url');

const createSessionValue = () => {
  const payload = Buffer.from(
    JSON.stringify({
      username: config.ADMIN_USERNAME,
      expiresAt: Date.now() + sessionMaxAgeMs
    })
  ).toString('base64url');

  return `${payload}.${signSessionPayload(payload)}`;
};

const readCookie = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return null;

  return (
    cookieHeader
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
};

const isValidSession = (value: string | null) => {
  if (!value) return false;

  const [payload, signature] = value.split('.');
  if (!payload || !signature || !safeCompare(signature, signSessionPayload(payload))) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      username?: string;
      expiresAt?: number;
    };

    return session.username === config.ADMIN_USERNAME && Number(session.expiresAt) > Date.now();
  } catch (_error) {
    return false;
  }
};

const sessionCookieOptions = {
  httpOnly: true,
  maxAge: sessionMaxAgeMs,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/admin'
} as const;

const clearSessionCookieOptions = {
  httpOnly: true,
  sameSite: sessionCookieOptions.sameSite,
  secure: sessionCookieOptions.secure,
  path: sessionCookieOptions.path
} as const;

adminRouter.post('/login', (req, res) => {
  const payload = loginSchema.parse(req.body);

  if (
    !safeCompare(payload.username, config.ADMIN_USERNAME) ||
    !safeCompare(payload.password, config.ADMIN_PASSWORD)
  ) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  res.cookie(adminSessionCookie, createSessionValue(), sessionCookieOptions);
  res.json({ ok: true });
});

adminRouter.post('/logout', (_req, res) => {
  res.clearCookie(adminSessionCookie, clearSessionCookieOptions);
  res.json({ ok: true });
});

adminRouter.get('/me', (req, res) => {
  if (!isValidSession(readCookie(req.header('cookie'), adminSessionCookie))) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  res.json({ username: config.ADMIN_USERNAME });
});

adminRouter.use((req, res, next) => {
  if (!isValidSession(readCookie(req.header('cookie'), adminSessionCookie))) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  next();
});

const parseEventDate = (value: string) => new Date(`${value}T12:00:00.000Z`);

adminRouter.get('/content', async (_req, res, next) => {
  try {
    const [content, events, gallery] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: editorialContentKey } }),
      prisma.bistroEvent.findMany({
        orderBy: [{ eventDate: 'asc' }, { createdAt: 'asc' }]
      }),
      prisma.galleryPhoto.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
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

adminRouter.put('/content/editorial', async (req, res, next) => {
  try {
    const payload = editorialContentSchema.parse(req.body);

    const content = await prisma.siteContent.upsert({
      where: { key: editorialContentKey },
      update: { value: payload },
      create: { key: editorialContentKey, value: payload }
    });

    res.json(normalizeEditorialContent(content.value));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/events', async (req, res, next) => {
  try {
    const payload = eventSchema.parse(req.body);

    res.status(201).json(
      await prisma.bistroEvent.create({
        data: {
          title: payload.title,
          eventDate: parseEventDate(payload.eventDate),
          eventTime: payload.eventTime || null,
          summary: payload.summary,
          details: payload.details || null,
          imageUrl: payload.imageUrl || null,
          ctaLabel: payload.ctaLabel || null,
          ctaUrl: payload.ctaUrl || null,
          isPublished: payload.isPublished
        }
      })
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/events/:id', async (req, res, next) => {
  try {
    const payload = eventSchema.parse(req.body);

    res.json(
      await prisma.bistroEvent.update({
        where: { id: req.params.id },
        data: {
          title: payload.title,
          eventDate: parseEventDate(payload.eventDate),
          eventTime: payload.eventTime || null,
          summary: payload.summary,
          details: payload.details || null,
          imageUrl: payload.imageUrl || null,
          ctaLabel: payload.ctaLabel || null,
          ctaUrl: payload.ctaUrl || null,
          isPublished: payload.isPublished
        }
      })
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/events/:id', async (req, res, next) => {
  try {
    await prisma.bistroEvent.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/gallery', async (req, res, next) => {
  try {
    const payload = galleryPhotoSchema.parse(req.body);
    const imageUrl = payload.imageUrl ?? '';

    res.status(201).json(
      await prisma.galleryPhoto.create({
        data: {
          title: payload.title,
          category: payload.category,
          alt: payload.alt || null,
          imageUrl,
          sortOrder: payload.sortOrder,
          isPublished: payload.isPublished
        }
      })
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/gallery/:id', async (req, res, next) => {
  try {
    const payload = galleryPhotoSchema.parse(req.body);
    const imageUrl = payload.imageUrl ?? '';

    res.json(
      await prisma.galleryPhoto.update({
        where: { id: req.params.id },
        data: {
          title: payload.title,
          category: payload.category,
          alt: payload.alt || null,
          imageUrl,
          sortOrder: payload.sortOrder,
          isPublished: payload.isPublished
        }
      })
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/gallery/:id', async (req, res, next) => {
  try {
    await prisma.galleryPhoto.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/reservations', async (req, res, next) => {
  try {
    const query = listReservationsSchema.parse(req.query);

    res.json(
      await prisma.reservation.findMany({
        where: {
          reservationDate: query.date ? normalizeReservationDate(query.date) : undefined,
          service: query.service ? normalizeService(query.service) : undefined,
          status: query.status
        },
        orderBy: [
          { reservationDate: 'asc' },
          { reservationTime: 'asc' },
          { createdAt: 'asc' }
        ]
      })
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/schedules', async (_req, res, next) => {
  try {
    const schedules = await prisma.serviceSchedule.findMany({
      orderBy: [{ weekday: 'asc' }, { service: 'asc' }]
    });

    const items = Array.from({ length: 7 }, (_, weekday) =>
      ['midi', 'soir'].map((serviceValue) => {
        const service = normalizeService(serviceValue);
        const existing = schedules.find(
          (item) => item.weekday === weekday && item.service === service
        );
        const defaultHours = getDefaultHours(service);

        return {
          weekday,
          service: serviceValue,
          capacity: existing?.capacity ?? getDefaultCapacity(service),
          isClosed: existing?.isClosed ?? false,
          openTime: existing?.openTime ?? defaultHours.openTime,
          closeTime: existing?.closeTime ?? defaultHours.closeTime,
          note: existing?.note ?? ''
        };
      })
    ).flat();

    res.json(items);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/reservations/:id/status', async (req, res, next) => {
  try {
    const payload = updateStatusSchema.parse(req.body);

    res.json(
      await prisma.reservation.update({
        where: { id: req.params.id },
        data: {
          status: payload.status,
          notes: payload.notes
        }
      })
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/reservations', async (req, res, next) => {
  try {
    const payload = createAdminReservationSchema.parse(req.body);
    const reservationDate = normalizeReservationDate(payload.reservationDate);
    const service = normalizeService(payload.service);
    const availability = await getServiceAvailability(reservationDate, service);
    const blocksCapacity =
      payload.status === ReservationStatus.PENDING || payload.status === ReservationStatus.CONFIRMED;

    if (availability.isClosed && blocksCapacity) {
      return res.status(409).json({
        error: 'SERVICE_CLOSED',
        message: `${serviceLabel(service)} est ferme pour cette date.`
      });
    }

    if (blocksCapacity && payload.partySize > availability.remainingSeats) {
      return res.status(409).json({
        error: 'SERVICE_FULL',
        message: `Il ne reste plus assez de places pour ${serviceLabel(service).toLowerCase()}.`,
        availability
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        email: payload.email || null,
        reservationDate,
        reservationTime: payload.reservationTime,
        service,
        partySize: payload.partySize,
        message: payload.message || null,
        notes: payload.notes || null,
        source: payload.source,
        status: payload.status
      }
    });

    res.status(201).json({ reservation });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/capacities', async (req, res, next) => {
  try {
    const payload = upsertCapacitySchema.parse(req.body);
    const reservationDate = normalizeReservationDate(payload.date);
    const service = normalizeService(payload.service);

    res.json(
      await prisma.serviceCapacity.upsert({
        where: {
          reservationDate_service: {
            reservationDate,
            service
          }
        },
        update: {
          capacity: payload.capacity,
          isClosed: payload.isClosed,
          note: payload.note
        },
        create: {
          reservationDate,
          service,
          capacity: payload.capacity,
          isClosed: payload.isClosed,
          note: payload.note
        }
      })
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/schedules', async (req, res, next) => {
  try {
    const payload = upsertScheduleSchema.parse(req.body);
    const service = normalizeService(payload.service);

    res.json(
      await prisma.serviceSchedule.upsert({
        where: {
          weekday_service: {
            weekday: payload.weekday,
            service
          }
        },
        update: {
          capacity: payload.capacity,
          isClosed: payload.isClosed,
          openTime: payload.openTime || null,
          closeTime: payload.closeTime || null,
          note: payload.note || null
        },
        create: {
          weekday: payload.weekday,
          service,
          capacity: payload.capacity,
          isClosed: payload.isClosed,
          openTime: payload.openTime || null,
          closeTime: payload.closeTime || null,
          note: payload.note || null
        }
      })
    );
  } catch (error) {
    next(error);
  }
});
