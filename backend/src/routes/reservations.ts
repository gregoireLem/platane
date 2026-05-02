import { ReservationStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import {
  getServiceAvailability,
  isTimeWithinRange,
  normalizeReservationDate,
  normalizeService,
  serviceLabel
} from '../lib/reservations.js';

const createReservationSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().trim().email().optional().or(z.literal('')),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/),
  service: z.enum(['midi', 'soir']),
  partySize: z.coerce.number().int().positive().max(20),
  message: z.string().trim().max(1000).optional().or(z.literal(''))
});

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service: z.enum(['midi', 'soir'])
});

export const reservationsRouter = Router();

reservationsRouter.get('/availability', async (req, res, next) => {
  try {
    const query = availabilityQuerySchema.parse(req.query);
    const reservationDate = normalizeReservationDate(query.date);
    const service = normalizeService(query.service);
    const availability = await getServiceAvailability(reservationDate, service);

    res.json({
      date: query.date,
      service: query.service,
      ...availability
    });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post('/', async (req, res, next) => {
  try {
    const payload = createReservationSchema.parse(req.body);
    const reservationDate = normalizeReservationDate(payload.reservationDate);
    const service = normalizeService(payload.service);
    const availability = await getServiceAvailability(reservationDate, service);

    if (availability.isClosed) {
      return res.status(409).json({
        error: 'SERVICE_CLOSED',
        message: `${serviceLabel(service)} est ferme pour cette date.`
      });
    }

    if (!isTimeWithinRange(payload.reservationTime, availability.openTime, availability.closeTime)) {
      return res.status(409).json({
        error: 'OUTSIDE_OPENING_HOURS',
        message: `Horaire hors ouverture pour ${serviceLabel(service).toLowerCase()} (${availability.openTime} - ${availability.closeTime}).`,
        availability
      });
    }

    if (payload.partySize > availability.remainingSeats) {
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
        status: ReservationStatus.PENDING
      }
    });

    res.status(201).json({
      reservation,
      availability: {
        ...availability,
        remainingSeats: availability.remainingSeats - payload.partySize,
        reservedSeats: availability.reservedSeats + payload.partySize
      }
    });
  } catch (error) {
    next(error);
  }
});
