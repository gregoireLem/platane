import { ReservationStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { normalizeReservationDate, normalizeService } from '../lib/reservations.js';

const adminTokenHeader = 'x-admin-token';

const listReservationsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  service: z.enum(['midi', 'soir']).optional(),
  status: z.nativeEnum(ReservationStatus).optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(ReservationStatus),
  notes: z.string().trim().max(1000).optional()
});

const upsertCapacitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service: z.enum(['midi', 'soir']),
  capacity: z.coerce.number().int().positive().max(500),
  isClosed: z.boolean().optional().default(false),
  note: z.string().trim().max(1000).optional()
});

export const adminRouter = Router();

adminRouter.use((req, res, next) => {
  if (req.header(adminTokenHeader) !== config.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  next();
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
