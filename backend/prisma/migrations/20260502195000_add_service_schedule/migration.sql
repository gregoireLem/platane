CREATE TABLE "ServiceSchedule" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "service" "Service" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceSchedule_weekday_service_key" ON "ServiceSchedule"("weekday", "service");
