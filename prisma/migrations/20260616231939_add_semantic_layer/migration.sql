-- Add Semantic Layer Tables

-- Entity Classifications: stores entity type, domain, disposition metadata
CREATE TABLE "entity_classifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "entityPluginId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityDomain" TEXT NOT NULL,
    "subtypes" TEXT,
    "disposition" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "classificationSource" TEXT,
    "classifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "entity_classifications_tenantId_entityPluginId_entityId_key" ON "entity_classifications"("tenantId", "entityPluginId", "entityId");
CREATE INDEX "entity_classifications_tenantId_entityType_idx" ON "entity_classifications"("tenantId", "entityType");
CREATE INDEX "entity_classifications_tenantId_disposition_idx" ON "entity_classifications"("tenantId", "disposition");
CREATE INDEX "entity_classifications_tenantId_entityDomain_idx" ON "entity_classifications"("tenantId", "entityDomain");

-- Semantic Properties: typed properties with units and semantics
CREATE TABLE "semantic_properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "entityPluginId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "semanticType" TEXT,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "confidence" DOUBLE PRECISION DEFAULT 1.0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "semantic_properties_tenantId_entityPluginId_entityId_propertyName_key" ON "semantic_properties"("tenantId", "entityPluginId", "entityId", "propertyName");
CREATE INDEX "semantic_properties_tenantId_entityPluginId_entityId_idx" ON "semantic_properties"("tenantId", "entityPluginId", "entityId");

-- Entity Provenance: tracks source lineage and fusion
CREATE TABLE "entity_provenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "entityPluginId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourcePluginId" TEXT NOT NULL,
    "sourceTimestamp" TIMESTAMP(3) NOT NULL,
    "sourceDescription" TEXT,
    "fusedFromPluginIds" TEXT,
    "fusedFromEntityIds" TEXT,
    "corroboratingPlugins" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "entity_provenance_tenantId_entityPluginId_entityId_key" ON "entity_provenance"("tenantId", "entityPluginId", "entityId");
CREATE INDEX "entity_provenance_tenantId_entityPluginId_entityId_idx" ON "entity_provenance"("tenantId", "entityPluginId", "entityId");
CREATE INDEX "entity_provenance_tenantId_sourcePluginId_idx" ON "entity_provenance"("tenantId", "sourcePluginId");

-- Semantic Relationships: ontology graph edges
CREATE TABLE "semantic_relationships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "sourcePluginId" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetPluginId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "context" TEXT,
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "semantic_relationships_tenantId_sourcePluginId_sourceEntityId_targetPluginId_targetEntityId_relationshipType_key" ON "semantic_relationships"("tenantId", "sourcePluginId", "sourceEntityId", "targetPluginId", "targetEntityId", "relationshipType");
CREATE INDEX "semantic_relationships_tenantId_sourcePluginId_sourceEntityId_idx" ON "semantic_relationships"("tenantId", "sourcePluginId", "sourceEntityId");
CREATE INDEX "semantic_relationships_tenantId_targetPluginId_targetEntityId_idx" ON "semantic_relationships"("tenantId", "targetPluginId", "targetEntityId");
CREATE INDEX "semantic_relationships_tenantId_relationshipType_idx" ON "semantic_relationships"("tenantId", "relationshipType");

-- Entity Threat Assessment: cached threat level for efficient queries
CREATE TABLE "entity_threat_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "entityPluginId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "threatLevel" TEXT NOT NULL,
    "hostilityScore" DOUBLE PRECISION NOT NULL,
    "proximityScore" DOUBLE PRECISION NOT NULL,
    "threatTypes" TEXT,
    "reasoningTrace" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "entity_threat_assessments_tenantId_entityPluginId_entityId_key" ON "entity_threat_assessments"("tenantId", "entityPluginId", "entityId");
CREATE INDEX "entity_threat_assessments_tenantId_threatLevel_idx" ON "entity_threat_assessments"("tenantId", "threatLevel");
CREATE INDEX "entity_threat_assessments_tenantId_entityPluginId_entityId_idx" ON "entity_threat_assessments"("tenantId", "entityPluginId", "entityId");
