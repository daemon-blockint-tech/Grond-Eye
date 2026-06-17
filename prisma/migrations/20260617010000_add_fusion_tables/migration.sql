-- Add Entity Fusion Tables for Phase 4: Multi-Source Fusion

-- Entity Fusion: track merged/deduplicated entities across sources
CREATE TABLE "entity_fusions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "canonicalPluginId" TEXT NOT NULL,
    "canonicalEntityId" TEXT NOT NULL,
    "fusedPluginIds" TEXT NOT NULL,
    "fusedEntityIds" TEXT NOT NULL,
    "fusionScore" DOUBLE PRECISION NOT NULL,
    "fusionReasons" TEXT,
    "fusionStrategy" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "entity_fusions_tenantId_canonicalPluginId_canonicalEntityId_key" ON "entity_fusions"("tenantId", "canonicalPluginId", "canonicalEntityId");
CREATE INDEX "entity_fusions_tenantId_validatedAt_idx" ON "entity_fusions"("tenantId", "validatedAt");
CREATE INDEX "entity_fusions_tenantId_fusionScore_idx" ON "entity_fusions"("tenantId", "fusionScore");

-- Fusion Events: audit trail of merge decisions and status changes
CREATE TABLE "fusion_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "fusionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION,
    "reasoning" TEXT,
    "actorUserId" TEXT,
    "actorAction" TEXT,
    "actorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fusion_events_fusionId_fkey" FOREIGN KEY ("fusionId") REFERENCES "entity_fusions" ("id") ON DELETE CASCADE
);

CREATE INDEX "fusion_events_tenantId_fusionId_idx" ON "fusion_events"("tenantId", "fusionId");
CREATE INDEX "fusion_events_tenantId_eventType_idx" ON "fusion_events"("tenantId", "eventType");
CREATE INDEX "fusion_events_tenantId_proposedAt_idx" ON "fusion_events"("tenantId", "proposedAt");
