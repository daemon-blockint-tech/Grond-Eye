# Semantic Layer Architecture

**Status:** Phase 1 Complete ✅  
**Date:** 2026-06-16  
**Implemented by:** Claude Code

---

## Overview

The **Semantic Layer** adds machine-readable type systems, ontological relationships, and semantic reasoning capabilities to Grond-Eye. It sits between the **Data Layer** (raw GeoEntity streams) and the **Agent Integrated Platform** (AI reasoning).

```
┌─────────────────────────────────────────┐
│ Agent Integrated Platform               │
│ (semantic queries, reasoning, decisions)│
└────────────────────┬────────────────────┘
                     ↑
┌─────────────────────────────────────────┐
│ SEMANTIC LAYER (Phase 1)                │
│ ├─ Entity Classifications               │
│ ├─ Semantic Properties                  │
│ ├─ Ontology Graph                       │
│ ├─ Relationship Traversal               │
│ └─ Provenance Tracking                  │
└────────────────────┬────────────────────┘
                     ↑
┌─────────────────────────────────────────┐
│ Data Layer                              │
│ (GeoEntity, plugins, cache, DataBus)    │
└─────────────────────────────────────────┘
```

---

## Phase 1 Components

### 1. **Entity Classifications**

Answers: _"What type of entity is this?"_

**Schema:**
```typescript
interface EntityClassification {
  type: EntityType;           // "aircraft" | "maritime_vessel" | "person" | ...
  domain: EntityDomain;       // "air" | "maritime" | "land" | "cyber" | "space"
  disposition?: Disposition;  // "friend" | "hostile" | "neutral" | "unknown"
  subtypes?: string[];        // ["fighter", "transport"] for aircraft
  confidence: Confidence;     // 0-1 scale
  classifiedAt: number;       // timestamp
}
```

**Database:**
- Table: `entity_classifications`
- Indexes on: `(tenantId, entityType)`, `(tenantId, disposition)`, `(tenantId, entityDomain)`

**Benefits:**
- ✅ Type-based entity filtering ("find all aircraft")
- ✅ Threat assessment ("find all hostile entities")
- ✅ Domain-specific queries ("find maritime vessels")
- ✅ Temporal classification validity (expires_at)

### 2. **Semantic Properties**

Replaces opaque `properties: Record<string, unknown>` with **typed, unit-aware** attributes.

**Schema:**
```typescript
interface SemanticProperty {
  value: unknown;
  unit?: string;              // "knots", "meters", "meters_per_second"
  semanticType?: string;      // "speed", "heading", "distance", "altitude"
  confidence?: Confidence;    // How certain is this value?
  timestamp?: number;         // When was it observed?
}
```

**Database:**
- Table: `semantic_properties`
- Unique on: `(tenantId, entityPluginId, entityId, propertyName)`

**Example:**
```json
{
  "entityPluginId": "aviation-plugin",
  "entityId": "abc123",
  "propertyName": "airspeed",
  "semanticType": "speed",
  "value": 450,
  "unit": "knots",
  "confidence": 0.98,
  "timestamp": 1718558400000
}
```

**Benefits:**
- ✅ Unit conversion ("45 knots → 83 km/h")
- ✅ Semantic type checking ("is this a speed property?")
- ✅ Confidence scoring for uncertain values
- ✅ Temporal awareness (when was this observed?)

### 3. **Ontology Graph & Relationships**

Models how entities relate to each other.

**Schema:**
```typescript
interface SemanticRelationship {
  sourceId: string;           // entity reference
  targetId: string;           // entity reference
  relationshipType: string;   // "part_of" | "controlled_by" | "escorts" | ...
  confidence: Confidence;
  establishedAt: number;
  expiresAt?: number;         // temporal validity
}
```

**Relationship Types:**
- **Hierarchy:** `part_of`, `parent_of`, `member_of`, `commands`
- **Fusion:** `same_as` (entity from source A = entity from source B)
- **Threat:** `threatens`, `defends`, `supports`
- **Location:** `located_at`, `operates_from`
- **Capability:** `controlled_by`, `owns`, `deployed_by`
- **Observation:** `observes`, `communicates_with`, `escorts`

**Database:**
- Table: `semantic_relationships`
- Indexes on: source, target, relationshipType

**Example Queries:**
```typescript
// Get all aircraft controlled by a unit
graph.findRelatedEntities(unitPluginId, unitId, 'controlled_by')

// Get all entities escorted by this ship
graph.findRelatedEntities(shipPluginId, shipId, 'escorts')

// Traverse 2 hops: find all units under an organization
const hops = graph.traverseGraph(orgPluginId, orgId, 2)
```

### 4. **Entity Provenance**

Tracks source lineage and entity fusion.

**Schema:**
```typescript
interface EntityProvenance {
  sourcePluginId: string;
  sourceTimestamp: number;
  fusedFrom?: string[];           // List of entity IDs merged
  corroboratingPlugins?: string[]; // Which sources confirmed this?
  sourceDescription?: string;
}
```

**Database:**
- Table: `entity_provenance`
- Unique on: `(tenantId, entityPluginId, entityId)`

**Use Cases:**
- ✅ Explain why an entity exists ("from radar.adsb")
- ✅ Track fusion ("this AIS track + radar contact → single ship entity")
- ✅ Trust scoring ("how many sources confirm this?")
- ✅ Data lineage ("entity came from plugin X at time Y")

### 5. **Threat Assessment Cache**

Pre-computed threat levels for efficient queries.

**Schema:**
```typescript
interface EntityThreatAssessment {
  threatLevel: "low" | "medium" | "high" | "critical";
  hostilityScore: number;   // 0-1
  proximityScore: number;   // 0-1 (how close to friendly assets?)
  threatTypes: string[];    // ["military", "cyber", "infrastructure"]
  reasoningTrace?: object;  // How was this computed?
  assessedAt: number;
  expiresAt?: number;       // TTL for reassessment
}
```

**Database:**
- Table: `entity_threat_assessments`
- Indexes on: `(tenantId, threatLevel)` for quick "find critical threats"

---

## Core Classes

### `SemanticStore`

In-memory store for classifications, properties, relationships, and provenance.

```typescript
import { SemanticStore } from '@/core/semantic';

const store = new SemanticStore(tenantId);

// Classifications
store.setClassification(pluginId, entityId, classification);
const cls = store.getClassification(pluginId, entityId);
const fighters = store.findByType('aircraft');

// Properties
store.setProperty(pluginId, entityId, 'speed', { value: 450, unit: 'knots' });
const speed = store.getProperty(pluginId, entityId, 'speed');

// Relationships
const relId = store.addRelationship(relationship);
const outgoing = store.getRelationshipsFrom(pluginId, entityId);

// Traversal
const nearby = store.traverseRelationships(pluginId, entityId, maxDepth);
```

### `OntologyGraph`

Knowledge graph query interface.

```typescript
import { OntologyGraph } from '@/core/semantic';

const graph = new OntologyGraph(store);

// Type-based queries
const aircraft = graph.findEntitiesByType('aircraft');

// Relationship queries
const controlled = graph.findRelatedEntities(orgId, unitId, 'controlled_by');

// Traversal
const byDistance = graph.traverseGraph(sourceId, targetId, maxDepth);

// Path finding
const path = graph.findPath(sourceId, targetId, destId, destEntityId);

// Context aggregation
const context = graph.buildEntityContext(entityId);
```

---

## Integration Points

### With GeoEntity (Data Layer)

```typescript
// Old way (opaque properties)
entity.properties = { speed: 45, unit: 'knots' };

// New way (semantic properties)
store.setProperty(entity.pluginId, entity.id, 'speed', {
  value: 45,
  unit: 'knots',
  semanticType: 'speed',
  confidence: 0.98,
  timestamp: Date.now(),
});

const speedProp = store.getProperty(entity.pluginId, entity.id, 'speed');
console.log(`${speedProp.value} ${speedProp.unit}`); // "45 knots"
```

### With Agent Bus

Agents can now query semantically:

```typescript
// Agent asks: "Find all friendly aircraft near position X"
// Backend response (powered by semantic layer):
{
  "action": "provide_entities",
  "entities": [
    {
      "id": "aircraft-123",
      "classification": {
        "type": "aircraft",
        "subtypes": ["fighter"],
        "disposition": "friend",
        "confidence": 0.98
      },
      "distance": 5.2
    }
  ]
}
```

---

## Migration & Setup

### 1. Apply Database Migration

```bash
# Create migration
npx prisma migrate dev --name add_semantic_layer

# Or in production
npx prisma migrate deploy
```

**Tables created:**
- `entity_classifications`
- `semantic_properties`
- `entity_provenance`
- `semantic_relationships`
- `entity_threat_assessments`

### 2. Initialize Semantic Store

```typescript
import { getGlobalSemanticStore } from '@/core/semantic';

// In your app initialization (e.g., in a hook or layout)
const store = getGlobalSemanticStore(tenantId);

// Classifications are now stored and queryable
```

### 3. Classify Incoming Entities (Plugin Integration)

```typescript
// In your plugin seeder or data source handler
import { getGlobalSemanticStore } from '@/core/semantic';

const store = getGlobalSemanticStore();

// When you receive a GeoEntity
const entity = await fetchAircraft();

// Add classification
store.setClassification(entity.pluginId, entity.id, {
  type: 'aircraft',
  domain: 'air',
  subtypes: entity.properties.icaoType ? [entity.properties.icaoType] : [],
  disposition: 'unknown',
  confidence: 0.95,
  classifiedAt: Date.now(),
});

// Add semantic properties
store.setProperty(entity.pluginId, entity.id, 'altitude', {
  value: entity.altitude,
  unit: 'meters',
  semanticType: 'altitude',
  confidence: 0.98,
  timestamp: entity.timestamp.getTime(),
});
```

---

## Next Steps (Phase 2-3)

- **Phase 2:** Semantic Query Engine (MCP tools for agents)
  - `find_entities_by_type(type)`
  - `query_relationships(sourceId, relationshipType?)`
  - `spatial_semantic_query(lat, lon, radius, entityTypes)`

- **Phase 3:** Agent Reasoning Loop
  - Stateful agent context with ontology access
  - Threat inference rules
  - Decision tracing

---

## Testing

```typescript
import { SemanticStore, OntologyGraph } from '@/core/semantic';

describe('SemanticStore', () => {
  it('should store and retrieve classifications', () => {
    const store = new SemanticStore();
    const classification = {
      type: 'aircraft' as const,
      domain: 'air' as const,
      confidence: 0.95,
      classifiedAt: Date.now(),
    };
    
    store.setClassification('plugin1', 'entity1', classification);
    const retrieved = store.getClassification('plugin1', 'entity1');
    
    expect(retrieved?.type).toBe('aircraft');
    expect(retrieved?.confidence).toBe(0.95);
  });

  it('should find entities by type', () => {
    const store = new SemanticStore();
    store.setClassification('p1', 'e1', { type: 'aircraft', domain: 'air', confidence: 1, classifiedAt: Date.now() });
    store.setClassification('p1', 'e2', { type: 'maritime_vessel', domain: 'maritime', confidence: 1, classifiedAt: Date.now() });
    
    const aircraft = store.findByType('aircraft');
    expect(aircraft).toHaveLength(1);
    expect(aircraft[0].entityId).toBe('e1');
  });
});
```

---

## FAQ

**Q: Why not use a proper graph database?**  
A: Phase 1 uses in-memory store for speed (msec lookups). Phase 2-3 can add Neo4j or PostgreSQL JSON queries if needed.

**Q: How do I handle classification conflicts?**  
A: Confidence scores. If two sources classify an entity differently, the one with higher confidence wins. Store both for audit trail.

**Q: Can I add custom relationship types?**  
A: Yes, `relationshipType` is a string. Define your custom types in a constants file and document them.

**Q: What about performance with millions of entities?**  
A: In-memory store is fine for sessions. For persistence, use Prisma indexes and pagination. Batch operations.

---

## Files Created

```
packages/grond-plugin-sdk/src/
  └── semantic.ts                  # Type definitions

src/core/semantic/
  ├── index.ts                     # Module exports
  ├── semanticStore.ts             # Classification & property store
  ├── ontologyGraph.ts             # Relationship graph queries
  
prisma/
  ├── schema.prisma                # 5 new tables (updated)
  └── migrations/
      └── 20260616231939_add_semantic_layer/
          └── migration.sql        # SQL migration

docs/
  └── SEMANTIC_LAYER.md            # This file
```

---

## References

- [Grond Plugin SDK](./packages/grond-plugin-sdk/src)
- [Semantic Types](../packages/grond-plugin-sdk/src/semantic.ts)
- [Semantic Store](../src/core/semantic/semanticStore.ts)
- [Ontology Graph](../src/core/semantic/ontologyGraph.ts)
