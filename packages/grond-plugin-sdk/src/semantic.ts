/**
 * @file semantic.ts
 * @description Semantic layer types for entity classification and ontological reasoning.
 * Defines how entities are typed, classified, and related in a knowledge graph context.
 * @module @grond/plugin-sdk/semantic
 */

/**
 * Core entity type taxonomy. Covers major geospatial intelligence domains.
 */
export type EntityType =
  | 'aircraft'
  | 'maritime_vessel'
  | 'person'
  | 'organization'
  | 'facility'
  | 'event'
  | 'network_node'
  | 'geographic_region'
  | 'weapon_system'
  | 'sensor'
  | 'communication_channel'
  | 'satellite'
  | 'vehicle'
  | 'unknown';

/**
 * Domain classification for entities (air, maritime, etc.)
 */
export type EntityDomain =
  | 'air'
  | 'maritime'
  | 'land'
  | 'cyber'
  | 'space'
  | 'subsurface'
  | 'unknown';

/**
 * Friendly/hostile/neutral disposition (SIDC-style)
 */
export type Disposition =
  | 'friend'
  | 'hostile'
  | 'neutral'
  | 'unknown';

/**
 * Classification confidence (0-1 scale)
 */
export type Confidence = number; // 0-1

/**
 * Entity classification metadata.
 * Answers: "What type of entity is this?"
 */
export interface EntityClassification {
  /** Primary type (e.g., 'aircraft', 'maritime_vessel') */
  type: EntityType;

  /** Domain (air, maritime, land, cyber, space, subsurface) */
  domain: EntityDomain;

  /** Optional subtypes for granularity (e.g., 'fighter', 'transport' for aircraft) */
  subtypes?: string[];

  /** Disposition (friend/hostile/neutral/unknown) */
  disposition?: Disposition;

  /** Confidence in this classification (0-1) */
  confidence: Confidence;

  /** Timestamp of classification (when this was determined) */
  classifiedAt: number;

  /** Source that provided or inferred this classification */
  classificationSource?: string;
}

/**
 * Semantic property with unit, type, and confidence metadata.
 * Replaces opaque properties with typed, measurable attributes.
 */
export interface SemanticProperty {
  /** The actual value */
  value: unknown;

  /** Unit of measurement (e.g., 'knots', 'meters', 'meters_per_second') */
  unit?: string;

  /** Semantic property type (e.g., 'speed', 'heading', 'distance', 'altitude') */
  semanticType?: string;

  /** Confidence in this value (0-1) */
  confidence?: Confidence;

  /** When this property was last observed/updated */
  timestamp?: number;
}

/**
 * Provenance tracking: where did this entity come from?
 */
export interface EntityProvenance {
  /** Plugin ID that originally sourced this entity */
  sourcePluginId: string;

  /** Timestamp when entity was first observed by source */
  sourceTimestamp: number;

  /** If this entity was fused from multiple sources, list the entity IDs it was merged from */
  fusedFrom?: string[];

  /** Other plugin IDs that have confirmed/updated this entity */
  corroboratingPlugins?: string[];

  /** Human-readable source description */
  sourceDescription?: string;
}

/**
 * Extended GeoEntity with semantic classification and ontological context.
 * Builds on the base GeoEntity by adding type system, relationships, and reasoning context.
 */
export interface SemanticEntity {
  // ─── Core spatial data (from GeoEntity) ─────────────────────
  id: string;
  pluginId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  label?: string;

  // ─── Semantic classification ─────────────────────────────────
  /** How the system classifies this entity */
  classification: EntityClassification;

  /** Typed properties with units and semantics */
  semanticProperties: Record<string, SemanticProperty>;

  /** Where this entity data came from */
  provenance: EntityProvenance;

  // ─── Ontological context ────────────────────────────────────
  /** Related entity IDs (for queries before full ontology loaded) */
  relatedEntityIds?: string[];

  /** Conflict/threat assessment (optional, can be computed dynamically) */
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';

  /** Parent organization/group (if entity is part of hierarchy) */
  parentId?: string;

  // ─── Optional metadata ──────────────────────────────────────
  /** Arbitrary plugin-specific properties (legacy support) */
  properties?: Record<string, unknown>;
}

/**
 * Relationship type taxonomy for the ontology graph.
 */
export type RelationshipType =
  | 'part_of'          // sensor is part_of network
  | 'controlled_by'    // aircraft controlled_by military_unit
  | 'same_as'          // entity from source A same_as entity from source B (fusion)
  | 'related_to'       // generic association
  | 'parent_of'        // organization parent_of sub_unit
  | 'member_of'        // person member_of organization
  | 'associated_with'  // loose association
  | 'threatens'        // hostile_force threatens civilian_area
  | 'defends'          // friendly_force defends facility
  | 'supports'         // support_unit supports combat_unit
  | 'located_at'       // entity located_at facility
  | 'operates_from'    // aircraft operates_from airbase
  | 'communicates_with' // device1 communicates_with device2
  | 'owns'             // organization owns facility
  | 'commands'         // commander commands unit
  | 'escorts'          // ship_a escorts ship_b
  | 'observes'         // sensor observes target
  | 'deployed_by'      // unit deployed_by organization
  | 'assigned_to'      // task assigned_to entity
  | 'fusion_of';       // derived_entity fusion_of source1, source2

/**
 * Semantic relationship edge in the ontology graph.
 * Enables traversal and context aggregation.
 */
export interface SemanticRelationship {
  /** Source entity ID */
  sourceId: string;

  /** Target entity ID */
  targetId: string;

  /** Type of relationship */
  relationshipType: RelationshipType;

  /** Confidence in this relationship (0-1) */
  confidence: Confidence;

  /** When was this relationship established? */
  establishedAt: number;

  /** When does it expire? (optional, for temporal reasoning) */
  expiresAt?: number;

  /** Contextual metadata */
  context?: Record<string, unknown>;
}

/**
 * Spatiotemporal context for an entity (used in queries).
 * Helps agents understand what's "near" an entity in space and time.
 */
export interface EntityContext {
  /** The focal entity */
  entityId: string;

  /** Entities within this radius (km) */
  nearbyEntitiesByDistance: {
    entityId: string;
    distanceKm: number;
    bearing?: number;
  }[];

  /** Entities directly related by the ontology */
  relatedEntities: {
    entityId: string;
    relationshipType: RelationshipType;
  }[];

  /** Summary of threat landscape */
  threatAssessment?: {
    hostilityLevel: number; // 0-1
    threatTypes: string[];
    proximity: { nearest: number; density: number };
  };

  /** Temporal context */
  lastUpdated: number;
  volatilityScore: number; // how much has this context changed recently? 0-1
}
