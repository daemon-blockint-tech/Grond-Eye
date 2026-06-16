/**
 * @file src/core/semantic/index.ts
 * @description Main exports for the semantic layer.
 * Provides access to classifications, relationships, queries, and ontological reasoning.
 */

export { SemanticStore, getGlobalSemanticStore, resetGlobalSemanticStore } from './semanticStore';
export { OntologyGraph } from './ontologyGraph';
export { SemanticQueryEngine } from './queryEngine';
export type {
  FindByTypeQuery,
  QueryRelationshipsQuery,
  SpatialSemanticQuery,
  ThreatAssessmentQuery,
  AggregateContextQuery,
  FindPathQuery,
  SemanticQuery,
  QueryResult,
  QueryResultEntity,
  ThreatAssessmentResult,
  ContextAggregationResult,
  PathFindingResult,
} from './queryTypes';
