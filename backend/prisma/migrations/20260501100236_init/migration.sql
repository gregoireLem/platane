-- CreateEnum
CREATE TYPE "Service" AS ENUM ('MIDI', 'SOIR');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "reservationTime" TEXT NOT NULL,
    "service" "Service" NOT NULL,
    "partySize" INTEGER NOT NULL,
    "message" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL DEFAULT 'website',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCapacity" (
    "id" TEXT NOT NULL,
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "service" "Service" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_reservationDate_service_status_idx" ON "Reservation"("reservationDate", "service", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCapacity_reservationDate_service_key" ON "ServiceCapacity"("reservationDate", "service");
