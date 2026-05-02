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

export const getDefaultHours = (service: Service) => {
  if (service === Service.MIDI) {
    return { openTime: '12:00', closeTime: '14:30' };
  }

  return { openTime: '19:00', closeTime: '22:30' };
};

export const getWeekdayIndex = (reservationDate: Date) => (reservationDate.getUTCDay() + 6) % 7;

export const isTimeWithinRange = (value: string, openTime: string, closeTime: string) =>
  value >= openTime && value <= closeTime;

export const getServiceAvailability = async (reservationDate: Date, service: Service) => {
  const [capacityOverride, schedule, reservations] = await Promise.all([
    prisma.serviceCapacity.findUnique({
      where: {
        reservationDate_service: {
          reservationDate,
          service
        }
      }
    }),
    prisma.serviceSchedule.findUnique({
      where: {
        weekday_service: {
          weekday: getWeekdayIndex(reservationDate),
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

  const defaultHours = getDefaultHours(service);
  const capacity = capacityOverride?.capacity ?? schedule?.capacity ?? getDefaultCapacity(service);
  const reservedSeats = reservations.reduce((sum, reservation) => sum + reservation.partySize, 0);
  const remainingSeats = Math.max(capacity - reservedSeats, 0);
  const isClosed = capacityOverride?.isClosed ?? schedule?.isClosed ?? false;
  const openTime = schedule?.openTime ?? defaultHours.openTime;
  const closeTime = schedule?.closeTime ?? defaultHours.closeTime;

  return {
    capacity,
    isClosed,
    openTime,
    closeTime,
    note: capacityOverride?.note ?? schedule?.note ?? null,
    remainingSeats,
    reservedSeats
  };
};
