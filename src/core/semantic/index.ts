/**
 * @file src/core/semantic/index.ts
 * @description Main exports for the semantic layer (Phases 1-3).
 * Provides access to classifications, queries, and agent reasoning.
 */

// Phase 1: Data Layer
export { SemanticStore, getGlobalSemanticStore, resetGlobalSemanticStore } from './semanticStore';
export { OntologyGraph } from './ontologyGraph';

// Phase 2: Query Engine
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

// Phase 3: Agent Reasoning
export { SemanticAgent } from './agentReasoning';
export { ThreatInferenceEngine } from './threatInference';
export { AgentContext, getAgentContext, clearAgentContext } from './agentContext';
export type {
  ThreatIntelligence,
  DecisionRationale,
  RationalizedAction,
  AgentGoal,
} from './agentContext';

// Phase 3+: LLM Integration (OpenRouter Deepseek V4 flash)
export { LLMSemanticAgent } from './llmAgent';
export { LLMThreatInferenceEngine } from './llmThreatInference';
