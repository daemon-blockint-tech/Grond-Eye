# Semantic Query Engine (Phase 2)

**Status:** Phase 2 Complete ✅  
**Date:** 2026-06-16  
**Builds on:** Phase 1 (Entity Classifications & Ontology)

---

## Overview

The **Semantic Query Engine** enables agents to execute natural-language-inspired queries over classified entities:

- _"Find all hostile aircraft"_
- _"What's controlling this ship?"_
- _"Find military threats within 50km of position X"_
- _"Assess the threat to location Y"_
- _"Who does this unit report to?"_

Instead of agents managing raw entity IDs, they now query by **semantic meaning** — type, disposition, relationships, locations.

---

## Architecture

```
Agent (external MCP tool)
         ↓
/api/agent/semantic-query (POST)
         ↓
SemanticQueryEngine.execute(query)
         ↓
SemanticStore (in-memory classifications/relationships)
         ↓
QueryResult (typed entity list with confidence)
         ↓
Agent (reasons about results)
```

---

## Query Types

### 1. **Find by Type** — `find_by_type`

Find entities matching semantic types and filters.

**Use cases:**
- "Find all aircraft"
- "Find all hostile military units"
- "Get friendly vessels in the maritime domain"

**Input:**
```typescript
{
  type: "find_by_type",
  entityTypes: ["aircraft"],           // Required
  domains?: ["air"],                   // Optional
  disposition?: "hostile",              // Optional
  minConfidence?: 0.8,                 // Optional
  limit?: 100                           // Optional
}
```

**Output:**
```typescript
{
  success: true,
  entities: [
    {
      pluginId: "aviation-plugin",
      entityId: "callsign-ABC123",
      latitude: 40.5,
      longitude: -74.2,
      altitude: 35000,
      speed: 450,
      label: "ABC123",
      classification: {
        type: "aircraft",
        domain: "air",
        subtypes: ["fighter"],
        disposition: "friend",
        confidence: 0.98
      }
    }
  ],
  count: 42,
  executionTimeMs: 12
}
```

### 2. **Query Relationships** — `query_relationships`

Find entities related to a source via semantic relationships.

**Use cases:**
- "What aircraft are escorted by this ship?"
- "Find all units controlled by this organization"
- "Show me the entire battalion structure"

**Input:**
```typescript
{
  type: "query_relationships",
  sourcePluginId: "military",
  sourceEntityId: "unit-123",
  relationshipTypes?: ["controls"],    // Optional
  traversalDepth?: 2,                  // Optional (1-3 hops)
  limit?: 100
}
```

**Output:**
```typescript
{
  success: true,
  entities: [
    {
      pluginId: "aviation",
      entityId: "aircraft-456",
      classification: { type: "aircraft", ... },
      relationshipType: "controlled_by",
      relationshipConfidence: 0.95
    },
    // ... more related entities
  ],
  count: 8,
  executionTimeMs: 45
}
```

**Relationship Types:**
- Hierarchy: `part_of`, `parent_of`, `member_of`, `commands`
- Threat: `threatens`, `defends`, `supports`, `escorts`
- Location: `located_at`, `operates_from`
- Control: `controlled_by`, `owned_by`, `deployed_by`
- Capability: `observes`, `communicates_with`
- Fusion: `same_as` (entity from source A = source B)

### 3. **Spatial Semantic Search** — `spatial_semantic`

Find entities in a geographic radius with semantic filters.

**Use cases:**
- "Find hostile contacts within 50km of position X"
- "Show all maritime vessels near the coast"
- "Get list of facilities in this region"

**Input:**
```typescript
{
  type: "spatial_semantic",
  latitude: 40.5,
  longitude: -74.2,
  radiusKm: 50,
  entityTypes?: ["aircraft", "maritime_vessel"],
  disposition?: "hostile",
  domains?: ["air", "maritime"],
  minConfidence?: 0.7,
  limit?: 50
}
```

**Output:**
```typescript
{
  success: true,
  entities: [
    {
      pluginId: "radar",
      entityId: "contact-789",
      latitude: 40.6,
      longitude: -74.15,
      distanceKm: 8.2,
      bearingDegrees: 45,
      classification: { type: "aircraft", disposition: "hostile", ... }
    }
    // ... sorted by distance
  ],
  count: 12,
  executionTimeMs: 78
}
```

### 4. **Assess Threat** — `threat_assessment`

Analyze threat level of an entity based on disposition, proximity, and relationships.

**Use cases:**
- "How threatening is this contact?"
- "What's the risk level to this location?"
- "Prioritize threats by severity"

**Input:**
```typescript
{
  type: "threat_assessment",
  entityPluginId: "radar",
  entityId: "contact-999",
  referenceLatitude?: 40.5,
  referenceLongitude?: -74.2,
  threatModel?: "combined"  // disposition | proximity | capability | combined
}
```

**Output:**
```typescript
{
  success: true,
  result: {
    entityPluginId: "radar",
    entityId: "contact-999",
    threatLevel: "critical",
    hostilityScore: 0.9,       // 0-1
    proximityScore: 0.8,       // 0-1 (how close?)
    threatTypes: ["military", "kinetic"],
    reasoning: {
      factors: [
        { factor: "disposition", weight: 0.6, contribution: 0.54 },
        { factor: "proximity", weight: 0.4, contribution: 0.32 }
      ],
      threshold: 0.5,
      confidence: 0.95
    },
    relatedThreats: [
      { entityId: "contact-888", relationshipType: "escorts", threatLevel: "high" }
    ]
  },
  executionTimeMs: 23
}
```

**Threat Levels:**
- `low` (combined < 0.4)
- `medium` (0.4 ≤ combined < 0.6)
- `high` (0.6 ≤ combined < 0.8)
- `critical` (combined ≥ 0.8)

### 5. **Aggregate Context** — `aggregate_context`

Get comprehensive picture of an entity: related assets, threat landscape, organizational structure.

**Use cases:**
- "Tell me everything about this unit"
- "What's the threat environment around this location?"
- "Show organizational hierarchy"

**Input:**
```typescript
{
  type: "aggregate_context",
  entityPluginId: "aviation",
  entityId: "callsign-ABC123",
  traversalDepth?: 2  // 1-3 hops
}
```

**Output:**
```typescript
{
  success: true,
  result: {
    entityPluginId: "aviation",
    entityId: "callsign-ABC123",
    summary: {
      type: "aircraft",
      label: "ABC123",
      classification: { type: "aircraft", disposition: "friend", confidence: 0.98 }
    },
    relatedByType: {
      "aircraft": [
        { entityId: "XYZ789", classification: { type: "aircraft", ... } }
      ],
      "organization": [
        { entityId: "unit-456", classification: { type: "organization", ... } }
      ]
    },
    relatedByRelationship: {
      "operates_from": [
        { entityId: "base-111", relationshipType: "operates_from" }
      ],
      "escorted_by": [
        { entityId: "ship-222", relationshipType: "escorted_by" }
      ]
    },
    threatLandscape: {
      hostileCount: 3,
      friendlyCount: 12,
      neutralCount: 0,
      criticalThreats: [
        { entityId: "threat-555", threatLevel: "critical" }
      ]
    }
  },
  executionTimeMs: 67
}
```

### 6. **Find Relationship Path** — `find_path`

Find shortest relationship path connecting two entities.

**Use cases:**
- "How is aircraft A connected to military command?"
- "What's the command chain from soldier to general?"
- "Show me the relationship path"

**Input:**
```typescript
{
  type: "find_path",
  sourcePluginId: "aviation",
  sourceEntityId: "aircraft-A",
  targetPluginId: "military",
  targetEntityId: "command-base"
}
```

**Output:**
```typescript
{
  success: true,
  result: {
    sourcePluginId: "aviation",
    sourceEntityId: "aircraft-A",
    targetPluginId: "military",
    targetEntityId: "command-base",
    path: [
      {
        pluginId: "aviation",
        entityId: "aircraft-A",
        relationshipType: "controlled_by",
        hopNumber: 0
      },
      {
        pluginId: "military",
        entityId: "squadron-123",
        relationshipType: "part_of",
        hopNumber: 1
      },
      {
        pluginId: "military",
        entityId: "command-base",
        relationshipType: "reports_to",
        hopNumber: 2
      }
    ],
    pathLength: 3
  },
  executionTimeMs: 34
}
```

---

## API Endpoint

### **POST /api/agent/semantic-query**

Execute a semantic query.

**Auth:** Session cookie (same as `/api/agent/publish`)

**Request:**
```bash
curl -X POST http://localhost:3000/api/agent/semantic-query \
  -H "Content-Type: application/json" \
  -d '{
    "type": "find_by_type",
    "entityTypes": ["aircraft"],
    "disposition": "hostile",
    "limit": 10
  }'
```

**Response:**
```json
{
  "success": true,
  "query": { ... },
  "entities": [ ... ],
  "count": 3,
  "executionTimeMs": 12
}
```

### **GET /api/agent/semantic-query**

Discover available semantic query tools.

**Response:**
```json
{
  "tools": [
    {
      "name": "find_entities_by_type",
      "description": "Find entities by type and filters"
    },
    { ... }
  ]
}
```

---

## Integration with Agent Bus

Agents call semantic queries and receive results, then act on them:

```typescript
// Agent workflow:
// 1. Query: "Find hostile aircraft"
const queryResponse = await fetch('/api/agent/semantic-query', {
  method: 'POST',
  body: JSON.stringify({
    type: 'find_by_type',
    entityTypes: ['aircraft'],
    disposition: 'hostile',
    limit: 20
  })
});

const { entities } = await queryResponse.json();

// 2. Reason: "Prioritize by threat level"
const sorted = entities.sort((a, b) => threatScore(b) - threatScore(a));

// 3. Act: "Alert operators and highlight on map"
for (const entity of sorted.slice(0, 5)) {
  await fetch('/api/agent/publish', {
    method: 'POST',
    body: JSON.stringify({
      action: 'highlight_layer',
      pluginId: entity.pluginId,
      entityId: entity.entityId,
      severity: 'critical'
    })
  });
}
```

---

## Usage Examples

### Example 1: Find and Highlight Threats

```typescript
import { getGlobalSemanticStore, SemanticQueryEngine } from '@/core/semantic';

const store = getGlobalSemanticStore();
const engine = new SemanticQueryEngine(store);

// Query all hostile contacts
const result = await engine.execute({
  type: 'find_by_type',
  entityTypes: ['aircraft', 'maritime_vessel'],
  disposition: 'hostile',
  limit: 20
});

// Act on results
for (const entity of result.entities) {
  console.log(`Threat: ${entity.label} (${entity.classification?.type})`);
}
```

### Example 2: Assess Local Threats

```typescript
const threats = await engine.execute({
  type: 'spatial_semantic',
  latitude: 40.5,
  longitude: -74.2,
  radiusKm: 100,
  disposition: 'hostile'
});

const criticalCount = threats.entities.filter(
  e => e.threatLevel === 'critical'
).length;

console.log(`${criticalCount} critical threats within 100km`);
```

### Example 3: Organizational Hierarchy

```typescript
const hierarchy = engine.aggregateContext({
  entityPluginId: 'military',
  entityId: 'unit-123',
  traversalDepth: 3
});

// Get all personnel in this unit
const personnel = hierarchy.result.relatedByType['person'] ?? [];
console.log(`Unit has ${personnel.length} personnel`);
```

### Example 4: Relationship Analysis

```typescript
// "Show me everything this entity controls"
const controlled = await engine.execute({
  type: 'query_relationships',
  sourcePluginId: 'military',
  sourceEntityId: 'command-unit',
  relationshipTypes: ['controls'],
  traversalDepth: 2
});

console.log(`Command unit controls ${controlled.count} entities`);
```

---

## Performance Considerations

### Indexing

SemanticStore uses Maps (O(1) lookup):
- `classifications`: `(pluginId:entityId)` → O(1)
- `semanticProperties`: `(pluginId:entityId:propertyName)` → O(1)
- `relationships`: traversal O(E) where E = edges

### Query Complexity

| Query Type | Complexity | Notes |
|-----------|-----------|-------|
| find_by_type | O(N) | N = total entities |
| query_relationships | O(E * D) | E = edges, D = depth (1-3) |
| spatial_semantic | O(N) | Filters all entities |
| threat_assessment | O(E) | Related entities |
| aggregate_context | O(E * D) | Full context traversal |
| find_path | O(E) | BFS traversal |

### Optimization Tips

1. **Use limit** to cap results
2. **Filter early** — apply disposition/domain filters before returning
3. **Batch queries** instead of querying per-entity
4. **Cache context** for frequently-queried entities

---

## Testing

```typescript
import { SemanticStore, SemanticQueryEngine } from '@/core/semantic';

describe('SemanticQueryEngine', () => {
  let store: SemanticStore;
  let engine: SemanticQueryEngine;

  beforeEach(() => {
    store = new SemanticStore();
    engine = new SemanticQueryEngine(store);

    // Populate test data
    store.setClassification('aviation', 'A1', {
      type: 'aircraft',
      domain: 'air',
      disposition: 'hostile',
      confidence: 0.95,
      classifiedAt: Date.now(),
    });
  });

  it('should find entities by type', async () => {
    const result = await engine.execute({
      type: 'find_by_type',
      entityTypes: ['aircraft'],
    });

    expect(result.count).toBe(1);
    expect(result.entities[0].classification?.disposition).toBe('hostile');
  });
});
```

---

## Files Created

```
src/core/semantic/
  ├── queryTypes.ts              # Query and result type definitions
  ├── queryEngine.ts             # Query execution engine
  └── index.ts                   # Updated exports

src/lib/agent/
  └── semanticTools.ts           # MCP tool definitions

src/app/api/agent/
  └── semantic-query/
      └── route.ts               # API endpoint

docs/
  └── SEMANTIC_QUERY_ENGINE.md   # This file
```

---

## Next Steps (Phase 3)

- **Agent Reasoning Loop:** Stateful agent context with semantic query results
- **Threat Inference Rules:** REGO-based threat scoring
- **Decision Tracing:** Explain why agent took an action
- **MCP Server Integration:** Wire up tools to external MCP servers

---

## References

- [Phase 1: Semantic Layer](./SEMANTIC_LAYER.md)
- [Agent Bus](../src/lib/agent/bus.ts)
- [Query Types](../src/core/semantic/queryTypes.ts)
- [Query Engine](../src/core/semantic/queryEngine.ts)
