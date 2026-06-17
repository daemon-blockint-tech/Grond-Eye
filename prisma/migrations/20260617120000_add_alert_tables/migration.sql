-- CreateTable alerts
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "sourceAlertIds" TEXT NOT NULL,
    "aggregatedCount" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourcePluginId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "enrichedContext" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "escalationLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "routes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "suppressedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable alert_events
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "alertId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT,
    "actorUserId" TEXT,
    "actorAction" TEXT,
    "actorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerts_tenantId_status_idx" ON "alerts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "alerts_tenantId_severity_idx" ON "alerts"("tenantId", "severity");

-- CreateIndex
CREATE INDEX "alerts_tenantId_createdAt_idx" ON "alerts"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "alerts_tenantId_lastSeen_idx" ON "alerts"("tenantId", "lastSeen");

-- CreateIndex
CREATE INDEX "alert_events_tenantId_alertId_idx" ON "alert_events"("tenantId", "alertId");

-- CreateIndex
CREATE INDEX "alert_events_tenantId_eventType_idx" ON "alert_events"("tenantId", "eventType");

-- CreateIndex
CREATE INDEX "alert_events_tenantId_createdAt_idx" ON "alert_events"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
