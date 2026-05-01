import { ReservationStatus, Service } from '@prisma/client';
import { prisma } from '../db.js';

const BLOCKING_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED
];

export const normalizeService = (value: string) =>
  value.toLowerCase() === 'midi' ? Service.MIDI : Service.SOIR;

export const serviceLabel = (service: Service) =>
  service === Service.MIDI ? 'Midi' : 'Soir';

export const normalizeReservationDate = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Date de reservation invalide');
  }

  return date;
};

export const getDefaultCapacity = (service: Service) => {
  if (service === Service.MIDI) return 30;
  return 40;
};

export const getServiceAvailability = async (reservationDate: Date, service: Service) => {
  const [capacityOverride, reservations] = await Promise.all([
    prisma.serviceCapacity.findUnique({
      where: {
        reservationDate_service: {
          reservationDate,
          service
        }
      }
    }),
    prisma.reservation.findMany({
      where: {
        reservationDate,
        service,
        status: { in: BLOCKING_STATUSES }
      },
      select: {
        partySize: true
      }
    })
  ]);

  const capacity = capacityOverride?.capacity ?? getDefaultCapacity(service);
  const reservedSeats = reservations.reduce((sum, reservation) => sum + reservation.partySize, 0);
  const remainingSeats = Math.max(capacity - reservedSeats, 0);

  return {
    capacity,
    isClosed: capacityOverride?.isClosed ?? false,
    note: capacityOverride?.note ?? null,
    remainingSeats,
    reservedSeats
  };
};
