import { FusedThreatSignal } from './SensorFusion';

export interface AdaptationContext {
  executionId: string;
  playbookId: string;
  entityId: string;
  currentThreatLevel: number;
  initialThreatLevel: number;
  threatTrend: 'increasing' | 'decreasing' | 'stable';
  threatVelocity: number;
  lastUpdate: number;
}

export interface ExecutionAdaptation {
  adaptationId: string;
  executionId: string;
  adaptationType: 'escalate' | 'de_escalate' | 'pivot' | 'abort' | 'accelerate' | 'extend_monitoring';
  triggerReason: string;
  originalPlan: string[];
  adaptedPlan: string[];
  timestamp: number;
  confidence: number;
}

export interface PlanModification {
  modificationId: string;
  executionId: string;
  actionIndex: number;
  originalAction: string;
  modifiedAction: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  reversible: boolean;
}

export class DynamicPlanningEngine {
  private adaptationContexts: Map<string, AdaptationContext> = new Map();
  private executionAdaptations: ExecutionAdaptation[] = [];
  private planModifications: PlanModification[] = [];

  evaluateThreat(
    executionId: string,
    entityId: string,
    threatSignal: FusedThreatSignal,
    context: Partial<AdaptationContext>,
  ): ExecutionAdaptation | null {
    const adaptationContext: AdaptationContext = {
      executionId,
      playbookId: context.playbookId || '',
      entityId,
      currentThreatLevel: threatSignal.threatLevel,
      initialThreatLevel: context.initialThreatLevel || threatSignal.threatLevel,
      threatTrend: this.calculateThreatTrend(executionId, threatSignal.threatLevel),
      threatVelocity: this.calculateThreatVelocity(executionId, threatSignal.threatLevel),
      lastUpdate: Date.now(),
    };

    this.adaptationContexts.set(executionId, adaptationContext);

    const adaptation = this.determineAdaptation(adaptationContext, threatSignal);
    if (adaptation) {
      this.executionAdaptations.push(adaptation);
    }

    return adaptation || null;
  }

  private calculateThreatTrend(
    executionId: string,
    currentThreat: number,
  ): 'increasing' | 'decreasing' | 'stable' {
    const context = this.adaptationContexts.get(executionId);
    if (!context) return 'stable';

    const diff = currentThreat - context.currentThreatLevel;
    const threshold = 5;

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  private calculateThreatVelocity(
    executionId: string,
    currentThreat: number,
  ): number {
    const context = this.adaptationContexts.get(executionId);
    if (!context) return 0;

    const timeDelta = (Date.now() - context.lastUpdate) / 1000;
    const threatDelta = currentThreat - context.currentThreatLevel;

    return timeDelta > 0 ? threatDelta / timeDelta : 0;
  }

  private determineAdaptation(
    context: AdaptationContext,
    threatSignal: FusedThreatSignal,
  ): ExecutionAdaptation | null {
    const adaptationId = `adapt-${Date.now()}`;
    const threatDelta = context.currentThreatLevel - context.initialThreatLevel;
    const highRiskIndicators = threatSignal.indicators.length > 0
      ? threatSignal.indicators.filter((i) => i.severity > 70).length
      : 0;

    if (context.threatTrend === 'increasing' && context.threatVelocity > 1) {
      if (context.currentThreatLevel > 80) {
        return {
          adaptationId,
          executionId: context.executionId,
          adaptationType: 'escalate',
          triggerReason: `Threat rapidly escalating (velocity: ${context.threatVelocity.toFixed(2)}/s, level: ${context.currentThreatLevel.toFixed(1)})`,
          originalPlan: ['analyze', 'isolate', 'collect'],
          adaptedPlan: ['immediate_isolate', 'emergency_contain', 'rapid_collect', 'escalate_to_soc'],
          timestamp: Date.now(),
          confidence: Math.min(1, threatSignal.confidence + 0.2),
        };
      } else if (context.currentThreatLevel > 60) {
        return {
          adaptationId,
          executionId: context.executionId,
          adaptationType: 'accelerate',
          triggerReason: `Threat increasing (level: ${context.currentThreatLevel.toFixed(1)})`,
          originalPlan: ['analyze', 'isolate', 'collect'],
          adaptedPlan: ['fast_analyze', 'isolate', 'quick_collect'],
          timestamp: Date.now(),
          confidence: threatSignal.confidence,
        };
      }
    }

    if (context.threatTrend === 'decreasing' && threatDelta > 20) {
      return {
        adaptationId,
        executionId: context.executionId,
        adaptationType: 'de_escalate',
        triggerReason: `Threat substantially reduced (initial: ${context.initialThreatLevel.toFixed(1)}, current: ${context.currentThreatLevel.toFixed(1)})`,
        originalPlan: ['emergency_isolate', 'rapid_collect', 'soc_notification'],
        adaptedPlan: ['careful_isolate', 'standard_collect', 'team_notification'],
        timestamp: Date.now(),
        confidence: threatSignal.confidence,
      };
    }

    if (highRiskIndicators > 3 && context.currentThreatLevel > 75) {
      return {
        adaptationId,
        executionId: context.executionId,
        adaptationType: 'pivot',
        triggerReason: `Multiple high-severity indicators detected (${highRiskIndicators} indicators)`,
        originalPlan: ['standard_response', 'investigation', 'remediation'],
        adaptedPlan: ['containment', 'forensic_preservation', 'threat_hunt', 'escalation'],
        timestamp: Date.now(),
        confidence: threatSignal.confidence,
      };
    }

    if (context.currentThreatLevel > 90) {
      return {
        adaptationId,
        executionId: context.executionId,
        adaptationType: 'abort',
        triggerReason: `Critical threat level (${context.currentThreatLevel.toFixed(1)}) - human intervention required`,
        originalPlan: ['automated_response', 'investigation'],
        adaptedPlan: ['pause_execution', 'escalate_to_command'],
        timestamp: Date.now(),
        confidence: 1.0,
      };
    }

    if (context.threatTrend === 'stable' && context.currentThreatLevel > 50) {
      return {
        adaptationId,
        executionId: context.executionId,
        adaptationType: 'extend_monitoring',
        triggerReason: `Sustained elevated threat level (${context.currentThreatLevel.toFixed(1)})`,
        originalPlan: ['response', 'monitoring'],
        adaptedPlan: ['response', 'extended_monitoring', 'behavioral_analysis'],
        timestamp: Date.now(),
        confidence: threatSignal.confidence,
      };
    }

    return null;
  }

  modifyExecutionPlan(
    executionId: string,
    actionIndex: number,
    originalAction: string,
    modifiedAction: string,
    reason: string,
  ): PlanModification {
    const impact =
      modifiedAction.includes('emergency') || modifiedAction.includes('escalate')
        ? 'high'
        : modifiedAction === originalAction
          ? 'low'
          : 'medium';

    const reversible = !modifiedAction.includes('escalate');

    const modification: PlanModification = {
      modificationId: `mod-${Date.now()}`,
      executionId,
      actionIndex,
      originalAction,
      modifiedAction,
      reason,
      impact,
      reversible,
    };

    this.planModifications.push(modification);
    return modification;
  }

  getAdaptationHistory(executionId: string): ExecutionAdaptation[] {
    return this.executionAdaptations.filter((a) => a.executionId === executionId);
  }

  getModificationHistory(executionId: string): PlanModification[] {
    return this.planModifications.filter((m) => m.executionId === executionId);
  }

  getExecutionContext(executionId: string): AdaptationContext | null {
    return this.adaptationContexts.get(executionId) || null;
  }

  predictNextAdaptation(executionId: string): ExecutionAdaptation | null {
    const context = this.adaptationContexts.get(executionId);
    if (!context) return null;

    const currentTrend = context.threatTrend;
    const currentVelocity = context.threatVelocity;
    const currentLevel = context.currentThreatLevel;

    if (currentTrend === 'increasing' && currentVelocity > 0) {
      const projectedLevel = currentLevel + currentVelocity * 60;

      if (projectedLevel > 80) {
        return {
          adaptationId: `predict-${Date.now()}`,
          executionId,
          adaptationType: 'escalate',
          triggerReason: `Projected threat level: ${projectedLevel.toFixed(1)} in 60s`,
          originalPlan: [],
          adaptedPlan: [],
          timestamp: Date.now(),
          confidence: Math.min(1, Math.max(0.1, 1 - Math.abs(currentVelocity) / 20)),
        };
      }
    }

    return null;
  }

  getAdaptationStats(): {
    totalAdaptations: number;
    byType: Record<string, number>;
    averageConfidence: number;
  } {
    const byType: Record<string, number> = {};
    let totalConfidence = 0;

    for (const adaptation of this.executionAdaptations) {
      byType[adaptation.adaptationType] = (byType[adaptation.adaptationType] || 0) + 1;
      totalConfidence += adaptation.confidence;
    }

    return {
      totalAdaptations: this.executionAdaptations.length,
      byType,
      averageConfidence:
        this.executionAdaptations.length > 0
          ? totalConfidence / this.executionAdaptations.length
          : 0,
    };
  }

  clearHistory(): void {
    this.executionAdaptations = [];
    this.planModifications = [];
    this.adaptationContexts.clear();
  }
}
