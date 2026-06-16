/**
 * @file semanticTools.ts
 * @description MCP-compatible tool definitions for semantic queries.
 * These tools enable external agents (via MCP) to query the semantic layer.
 *
 * Usage: Pass these tool definitions to your MCP server, which will call
 * the backend /api/agent/semantic-query endpoint with the tool input.
 */

import type {
  EntityType,
  EntityDomain,
  Disposition,
} from '@grond/plugin-sdk';

/**
 * MCP Tool: Find entities by type and filters.
 *
 * Example agent request:
 * ```
 * {
 *   "tool": "find_entities_by_type",
 *   "input": {
 *     "entityTypes": ["aircraft"],
 *     "disposition": "hostile",
 *     "limit": 10
 *   }
 * }
 * ```
 */
export const findEntitiesByTypeTool = {
  name: 'find_entities_by_type',
  description:
    'Find entities matching specific types and filters. Returns classified entities with confidence scores.',
  inputSchema: {
    type: 'object',
    properties: {
      entityTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'aircraft',
            'maritime_vessel',
            'person',
            'organization',
            'facility',
            'event',
            'network_node',
            'geographic_region',
            'weapon_system',
            'sensor',
            'communication_channel',
            'satellite',
            'vehicle',
            'unknown',
          ],
        },
        description: 'Entity types to search for',
        minItems: 1,
      },
      domains: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['air', 'maritime', 'land', 'cyber', 'space', 'subsurface', 'unknown'],
        },
        description: 'Optional domain filters (e.g., "air" for aircraft)',
      },
      disposition: {
        type: 'string',
        enum: ['friend', 'hostile', 'neutral', 'unknown'],
        description: 'Optional disposition filter',
      },
      minConfidence: {
        type: 'number',
        description: 'Minimum classification confidence (0-1)',
        minimum: 0,
        maximum: 1,
      },
      limit: {
        type: 'integer',
        description: 'Maximum results to return (default: 100)',
        default: 100,
        minimum: 1,
        maximum: 1000,
      },
    },
    required: ['entityTypes'],
  },
};

/**
 * MCP Tool: Query relationships from a source entity.
 *
 * Example agent request:
 * ```
 * {
 *   "tool": "query_relationships",
 *   "input": {
 *     "sourcePluginId": "military-org",
 *     "sourceEntityId": "unit-123",
 *     "relationshipTypes": ["controls"],
 *     "traversalDepth": 2,
 *     "limit": 50
 *   }
 * }
 * ```
 */
export const queryRelationshipsTool = {
  name: 'query_relationships',
  description:
    'Find entities related to a source entity via semantic relationships. Supports multi-hop traversal.',
  inputSchema: {
    type: 'object',
    properties: {
      sourcePluginId: {
        type: 'string',
        description: 'Plugin ID of source entity',
      },
      sourceEntityId: {
        type: 'string',
        description: 'Entity ID of source',
      },
      relationshipTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'part_of',
            'controlled_by',
            'same_as',
            'related_to',
            'parent_of',
            'member_of',
            'associated_with',
            'threatens',
            'defends',
            'supports',
            'located_at',
            'operates_from',
            'communicates_with',
            'owns',
            'commands',
            'escorts',
            'observes',
            'deployed_by',
            'assigned_to',
            'fusion_of',
          ],
        },
        description: 'Optional: filter by specific relationship types',
      },
      traversalDepth: {
        type: 'integer',
        description: 'How many hops to traverse (1-3)',
        minimum: 1,
        maximum: 3,
        default: 1,
      },
      limit: {
        type: 'integer',
        description: 'Maximum results to return (default: 100)',
        default: 100,
        minimum: 1,
        maximum: 1000,
      },
    },
    required: ['sourcePluginId', 'sourceEntityId'],
  },
};

/**
 * MCP Tool: Spatial + semantic search.
 *
 * Example agent request:
 * ```
 * {
 *   "tool": "spatial_semantic_query",
 *   "input": {
 *     "latitude": 40.5,
 *     "longitude": -74.2,
 *     "radiusKm": 50,
 *     "entityTypes": ["aircraft", "maritime_vessel"],
 *     "disposition": "hostile",
 *     "limit": 20
 *   }
 * }
 * ```
 */
export const spatialSemanticQueryTool = {
  name: 'spatial_semantic_query',
  description:
    'Find entities within a geographic radius matching semantic filters (type, disposition, etc.). Returns results sorted by distance.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        description: 'Reference latitude (WGS84)',
        minimum: -90,
        maximum: 90,
      },
      longitude: {
        type: 'number',
        description: 'Reference longitude (WGS84)',
        minimum: -180,
        maximum: 180,
      },
      radiusKm: {
        type: 'number',
        description: 'Search radius in kilometers',
        minimum: 0.1,
        maximum: 10000,
      },
      entityTypes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Entity types to search for',
      },
      disposition: {
        type: 'string',
        enum: ['friend', 'hostile', 'neutral', 'unknown'],
        description: 'Optional disposition filter',
      },
      domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional domain filters',
      },
      minConfidence: {
        type: 'number',
        description: 'Minimum classification confidence (0-1)',
        minimum: 0,
        maximum: 1,
      },
      limit: {
        type: 'integer',
        description: 'Maximum results to return (default: 50)',
        default: 50,
        minimum: 1,
        maximum: 500,
      },
    },
    required: ['latitude', 'longitude', 'radiusKm'],
  },
};

/**
 * MCP Tool: Assess threat level for an entity.
 *
 * Example agent request:
 * ```
 * {
 *   "tool": "assess_threat",
 *   "input": {
 *     "entityPluginId": "radar-plugin",
 *     "entityId": "contact-456",
 *     "referenceLatitude": 40.5,
 *     "referenceLongitude": -74.2,
 *     "threatModel": "combined"
 *   }
 * }
 * ```
 */
export const assessThreatTool = {
  name: 'assess_threat',
  description:
    'Analyze threat level of an entity based on disposition, proximity, and related entities. Returns threat level and reasoning.',
  inputSchema: {
    type: 'object',
    properties: {
      entityPluginId: {
        type: 'string',
        description: 'Plugin ID of entity to assess',
      },
      entityId: {
        type: 'string',
        description: 'Entity ID to assess',
      },
      referenceLatitude: {
        type: 'number',
        description: 'Optional reference latitude for proximity scoring',
        minimum: -90,
        maximum: 90,
      },
      referenceLongitude: {
        type: 'number',
        description: 'Optional reference longitude for proximity scoring',
        minimum: -180,
        maximum: 180,
      },
      threatModel: {
        type: 'string',
        enum: ['disposition', 'proximity', 'capability', 'combined'],
        description: 'Threat calculation model (default: combined)',
        default: 'combined',
      },
    },
    required: ['entityPluginId', 'entityId'],
  },
};

/**
 * MCP Tool: Aggregate context for an entity.
 *
 * Example agent request:
 * ```
 * {
 *   "tool": "aggregate_context",
 *   "input": {
 *     "entityPluginId": "aviation-plugin",
 *     "entityId": "callsign-N123",
 *     "traversalDepth": 2
 *   }
 * }
 * ```
 */
export const aggregateContextTool = {
  name: 'aggregate_context',
  description:
    'Get comprehensive context for an entity including related assets, threat landscape, and organizational relationships.',
  inputSchema: {
    type: 'object',
    properties: {
      entityPluginId: {
        type: 'string',
        description: 'Plugin ID of entity',
      },
      entityId: {
        type: 'string',
        description: 'Entity ID',
      },
      traversalDepth: {
        type: 'integer',
        description: 'How many relationship hops to traverse (1-3)',
        minimum: 1,
        maximum: 3,
        default: 2,
      },
    },
    required: ['entityPluginId', 'entityId'],
  },
};

/**
 * MCP Tool: Find relationship path between entities.
 *
 * Example agent request:
 * ```
 * {
 *   "tool": "find_relationship_path",
 *   "input": {
 *     "sourcePluginId": "aviation",
 *     "sourceEntityId": "aircraft-A",
 *     "targetPluginId": "military",
 *     "targetEntityId": "command-base",
 *   }
 * }
 * ```
 */
export const findRelationshipPathTool = {
  name: 'find_relationship_path',
  description:
    'Find the shortest relationship path connecting two entities. Reveals organizational hierarchies and connections.',
  inputSchema: {
    type: 'object',
    properties: {
      sourcePluginId: {
        type: 'string',
        description: 'Plugin ID of source entity',
      },
      sourceEntityId: {
        type: 'string',
        description: 'Entity ID of source',
      },
      targetPluginId: {
        type: 'string',
        description: 'Plugin ID of target entity',
      },
      targetEntityId: {
        type: 'string',
        description: 'Entity ID of target',
      },
    },
    required: ['sourcePluginId', 'sourceEntityId', 'targetPluginId', 'targetEntityId'],
  },
};

/**
 * All semantic query tools for MCP registration.
 */
export const semanticQueryTools = [
  findEntitiesByTypeTool,
  queryRelationshipsTool,
  spatialSemanticQueryTool,
  assessThreatTool,
  aggregateContextTool,
  findRelationshipPathTool,
];

/**
 * Tool name to handler mapping.
 */
export type SemanticToolName =
  | 'find_entities_by_type'
  | 'query_relationships'
  | 'spatial_semantic_query'
  | 'assess_threat'
  | 'aggregate_context'
  | 'find_relationship_path';
