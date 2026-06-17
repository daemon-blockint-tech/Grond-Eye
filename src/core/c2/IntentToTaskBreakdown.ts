import { PlaybookEngine } from './PlaybookEngine';

export interface TaskObjective {
  intent: string;
  targetEntities?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  constraints?: {
    maxDuration?: number;
    allowedPlatforms?: string[];
    threatLevelRange?: [number, number];
    blackoutWindows?: Array<{ start: number; end: number }>;
  };
  successCriteria?: string;
}

export interface DecomposedTask {
  id: string;
  objective: TaskObjective;
  steps: TaskStep[];
  estimatedDuration: number;
  resourceRequirements: ResourceRequirement[];
  riskAssessment: RiskAssessment;
  proposedPlaybooks: PlaybookSuggestion[];
}

export interface TaskStep {
  id: string;
  action: string;
  description: string;
  priority: number;
  dependencies: string[];
  estimatedDuration: number;
}

export interface ResourceRequirement {
  type: 'compute' | 'network' | 'storage' | 'security_clearance';
  quantity: number;
  priority: 'required' | 'preferred' | 'optional';
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  collateralDamageRisk: number;
  detectionRisk: number;
  reversibilityScore: number;
  recommendations: string[];
}

export interface PlaybookSuggestion {
  playbookId: string;
  name: string;
  matchScore: number;
  applicableSteps: string[];
  requiredParameters: Record<string, string>;
}

export class IntentToTaskBreakdown {
  private playbookEngine: PlaybookEngine;

  constructor(playbookEngine: PlaybookEngine) {
    this.playbookEngine = playbookEngine;
  }

  async decomposeIntent(objective: TaskObjective): Promise<DecomposedTask> {
    const taskId = `task-${Date.now()}`;
    const steps = this.parseIntentToSteps(objective.intent);
    const estimatedDuration = this.calculateDuration(steps);
    const resourceRequirements = this.identifyResources(steps);
    const riskAssessment = this.assessRisk(steps, objective.constraints);
    const proposedPlaybooks = this.suggestPlaybooks(steps);

    return {
      id: taskId,
      objective,
      steps,
      estimatedDuration,
      resourceRequirements,
      riskAssessment,
      proposedPlaybooks,
    };
  }

  private parseIntentToSteps(intent: string): TaskStep[] {
    const steps: TaskStep[] = [];
    const lowerIntent = intent.toLowerCase();

    const actionPatterns = [
      {
        pattern: /isolate|quarantine|segment/,
        action: 'isolate_entity',
        description: 'Isolate affected entity from network',
      },
      {
        pattern: /collect|gather|forensic/,
        action: 'collect_artifacts',
        description: 'Collect forensic evidence and artifacts',
      },
      {
        pattern: /block|prevent|stop/,
        action: 'block_threat',
        description: 'Block malicious traffic or processes',
      },
      {
        pattern: /scan|analyze|investigate/,
        action: 'scan_entity',
        description: 'Perform deep analysis and scanning',
      },
      {
        pattern: /notify|alert|escalate/,
        action: 'notify_team',
        description: 'Notify security team and stakeholders',
      },
      {
        pattern: /restore|recover|remediate/,
        action: 'restore_entity',
        description: 'Restore entity to clean state',
      },
      {
        pattern: /hunt|search|track/,
        action: 'threat_hunt',
        description: 'Hunt for additional indicators of compromise',
      },
    ];

    let stepPriority = 1;
    for (const pattern of actionPatterns) {
      if (pattern.pattern.test(lowerIntent)) {
        steps.push({
          id: `step-${stepPriority}`,
          action: pattern.action,
          description: pattern.description,
          priority: stepPriority,
          dependencies:
            stepPriority > 1
              ? [`step-${stepPriority - 1}`]
              : [],
          estimatedDuration: this.estimateActionDuration(pattern.action),
        });
        stepPriority++;
      }
    }

    if (steps.length === 0) {
      steps.push({
        id: 'step-1',
        action: 'investigate',
        description: 'Investigate entity for potential threats',
        priority: 1,
        dependencies: [],
        estimatedDuration: 300,
      });
    }

    return steps;
  }

  private estimateActionDuration(action: string): number {
    const durations: Record<string, number> = {
      isolate_entity: 30,
      collect_artifacts: 120,
      block_threat: 20,
      scan_entity: 300,
      notify_team: 10,
      restore_entity: 240,
      threat_hunt: 600,
      investigate: 180,
    };
    return durations[action] || 60;
  }

  private calculateDuration(steps: TaskStep[]): number {
    return steps.reduce((total, step) => total + step.estimatedDuration, 0);
  }

  private identifyResources(steps: TaskStep[]): ResourceRequirement[] {
    const resources: ResourceRequirement[] = [];

    const needsNetworkIsolation = steps.some((s) =>
      ['isolate_entity', 'block_threat'].includes(s.action),
    );
    if (needsNetworkIsolation) {
      resources.push({
        type: 'network',
        quantity: 1,
        priority: 'required',
      });
    }

    const needsCompute = steps.some((s) =>
      ['scan_entity', 'threat_hunt', 'investigate'].includes(s.action),
    );
    if (needsCompute) {
      resources.push({
        type: 'compute',
        quantity: 2,
        priority: 'required',
      });
    }

    const needsStorage = steps.some((s) =>
      ['collect_artifacts', 'scan_entity'].includes(s.action),
    );
    if (needsStorage) {
      resources.push({
        type: 'storage',
        quantity: 100,
        priority: 'preferred',
      });
    }

    resources.push({
      type: 'security_clearance',
      quantity: 1,
      priority: 'required',
    });

    return resources;
  }

  private assessRisk(
    steps: TaskStep[],
    constraints?: TaskObjective['constraints'],
  ): RiskAssessment {
    const destructiveActions = steps.filter((s) =>
      ['isolate_entity', 'block_threat', 'restore_entity'].includes(s.action),
    );

    let overallRisk: RiskAssessment['overallRisk'] = 'low';
    let collateralDamageRisk = 0.2;
    let detectionRisk = 0.3;
    let reversibilityScore = 0.9;
    const recommendations: string[] = [];

    if (destructiveActions.length > 0) {
      overallRisk = 'medium';
      collateralDamageRisk = 0.4;
      reversibilityScore = 0.7;
      recommendations.push(
        'Ensure backups are current before isolation/restoration',
      );
      recommendations.push('Monitor dependent services during execution');
    }

    if (steps.some((s) => s.action === 'threat_hunt')) {
      detectionRisk = 0.6;
      recommendations.push('Adversary may detect hunting activities');
    }

    if (steps.length > 5) {
      overallRisk = 'high';
      recommendations.push('Complex task sequence - higher failure probability');
    }

    if (constraints?.threatLevelRange) {
      const [min, max] = constraints.threatLevelRange;
      if (max > 80) {
        recommendations.push('High threat level - consider escalation path');
        collateralDamageRisk = Math.min(0.8, collateralDamageRisk + 0.2);
      }
    }

    return {
      overallRisk,
      collateralDamageRisk,
      detectionRisk,
      reversibilityScore,
      recommendations,
    };
  }

  private suggestPlaybooks(steps: TaskStep[]): PlaybookSuggestion[] {
    const allPlaybooks = this.playbookEngine.listPlaybooks();
    const suggestions: PlaybookSuggestion[] = [];

    for (const playbook of allPlaybooks) {
      let matchScore = 0;
      const applicableSteps: string[] = [];

      for (const step of steps) {
        const playbookDesc = playbook.description.toLowerCase();
        const playbookName = playbook.name.toLowerCase();

        if (
          playbookDesc.includes(step.action.replace(/_/g, ' ')) ||
          playbookName.includes(step.action.replace(/_/g, ' '))
        ) {
          matchScore += 0.3;
          applicableSteps.push(step.id);
        }

        if (step.action === 'isolate_entity' && playbookName.includes('isolate')) {
          matchScore += 0.4;
        }
        if (
          step.action === 'block_threat' &&
          (playbookName.includes('block') || playbookName.includes('quarantine'))
        ) {
          matchScore += 0.4;
        }
        if (
          step.action === 'collect_artifacts' &&
          playbookName.includes('collect')
        ) {
          matchScore += 0.4;
        }
      }

      if (matchScore > 0 && applicableSteps.length > 0) {
        suggestions.push({
          playbookId: playbook.id,
          name: playbook.name,
          matchScore: Math.min(1, matchScore),
          applicableSteps,
          requiredParameters: this.extractParameters(playbook),
        });
      }
    }

    return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }

  private extractParameters(playbook: any): Record<string, string> {
    const parameters: Record<string, string> = {};
    if (playbook.actions) {
      for (const action of playbook.actions) {
        if (action.type === 'command') {
          parameters[`command_${action.id}`] = `Execute ${action.commandId}`;
        }
        if (action.type === 'delay') {
          parameters[`delay_${action.id}`] = `${action.delayMs}ms`;
        }
      }
    }
    return parameters;
  }
}
