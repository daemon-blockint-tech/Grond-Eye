/**
 * @file src/core/fusion/index.ts
 * @description Main exports for the fusion engine (Phase 4a).
 */

export { FusionEngine, type FusionProposal, type FusionDecision } from './FusionEngine';
export {
  DeduplicationStrategy,
  SpatialProximityStrategy,
  SemanticNameStrategy,
  TemporalCoherenceStrategy,
  type Entity,
  type FusionCandidate,
  type ScoringResult,
} from './DeduplicationStrategy';
export { ConfidenceScorer, type StrategyScore } from './ConfidenceScoring';
