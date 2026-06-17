/**
 * Mission Planning Workflow
 * Full mission cycle support: Design → Plan → Execute → Debrief
 */

export interface MissionObjective {
  id: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  measurable: string; // How to measure success
  deadline?: number; // timestamp
  acceptableRisk: number; // 0-100%
}

export interface MissionConstraint {
  id: string;
  type: 'geographic' | 'temporal' | 'resource' | 'political' | 'environmental';
  description: string;
  impact: 'severe' | 'moderate' | 'minor';
  mitigationStrategy?: string;
}

export interface MissionTactic {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // seconds
  requiredResources: string[];
  successCriteria: string[];
  riskFactors: string[];
  alternativeTactics?: string[];
}

export interface MissionPlan {
  planId: string;
  objectives: MissionObjective[];
  constraints: MissionConstraint[];
  tactics: MissionTactic[];
  assignedResources: Array<{ resourceId: string; role: string }>;
  ruleOfEngagement: string[];
  estimatedDuration: number;
  acceptedRisks: string[];
  contingencyPlans: Array<{ trigger: string; action: string }>;
  approvedBy?: string;
  approvalTime?: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
}

export interface MissionExecution {
  executionId: string;
  planId: string;
  startTime: number;
  endTime?: number;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'aborted';
  executedTactics: Array<{
    tacticId: string;
    startTime: number;
    endTime?: number;
    status: 'pending' | 'executing' | 'success' | 'failed';
    actualDuration?: number;
    issues?: string[];
  }>;
  logs: Array<{
    timestamp: number;
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
  }>;
  resourcesUsed: Record<string, number>;
  objectivesAchieved: string[];
}

export interface MissionDebrief {
  debriefId: string;
  executionId: string;
  conductedBy: string;
  conductedAt: number;
  missionSuccess: boolean;
  objectivesAchieved: number;
  objectivesFailed: number;
  lessonsLearned: string[];
  recommendedImprovements: string[];
  resourcesOverrun: string[];
  delayedPhases: string[];
  successFactors: string[];
  failures: Array<{
    tacticId: string;
    cause: string;
    impact: 'severe' | 'moderate' | 'minor';
    recommendation: string;
  }>;
  overallEffectiveness: number; // 0-100%
  keyMetrics: Record<string, number>;
  nextActions: string[];
}

export class MissionPlanningWorkflow {
  private missions: Map<string, { plan: MissionPlan; execution?: MissionExecution; debrief?: MissionDebrief }> =
    new Map();
  private tacticLibrary: Map<string, MissionTactic> = new Map();
  private constraintLibrary: Map<string, MissionConstraint> = new Map();

  constructor() {
    this.initializeTacticLibrary();
    this.initializeConstraintLibrary();
  }

  private initializeTacticLibrary(): void {
    const tactics: MissionTactic[] = [
      {
        id: 'tactic-air-superiority',
        name: 'Air Superiority',
        description: 'Establish and maintain air superiority over target area',
        estimatedDuration: 3600,
        requiredResources: ['fighter_aircraft', 'air_defense_systems'],
        successCriteria: ['No hostile aircraft in airspace', 'All threats neutralized'],
        riskFactors: ['Enemy air defense', 'Weather conditions', 'Fuel constraints'],
        alternativeTactics: ['air_interdiction', 'defensive_air_operations'],
      },
      {
        id: 'tactic-ground-assault',
        name: 'Ground Assault',
        description: 'Execute coordinated ground offensive on enemy positions',
        estimatedDuration: 7200,
        requiredResources: ['main_battle_tanks', 'infantry', 'artillery'],
        successCriteria: ['Objective seized', 'Enemy forces routed'],
        riskFactors: ['Enemy fortifications', 'Civilian presence', 'Supply lines'],
        alternativeTactics: ['indirect_assault', 'infiltration'],
      },
      {
        id: 'tactic-intelligence-collection',
        name: 'Intelligence Collection',
        description: 'Gather intelligence on enemy positions and capabilities',
        estimatedDuration: 1800,
        requiredResources: ['spy_satellites', 'uavs', 'reconnaissance_aircraft'],
        successCriteria: ['Intelligence obtained', 'Target identified'],
        riskFactors: ['Detection', 'Weather conditions'],
        alternativeTactics: ['human_intelligence', 'signal_intelligence'],
      },
      {
        id: 'tactic-naval-blockade',
        name: 'Naval Blockade',
        description: 'Enforce naval blockade of enemy ports',
        estimatedDuration: 86400,
        requiredResources: ['destroyer', 'submarine', 'coastal_patrol'],
        successCriteria: ['No shipping traffic', 'Supply lines cut'],
        riskFactors: ['Mine fields', 'Submarine threats', 'International pressure'],
        alternativeTactics: ['limited_blockade', 'selective_interdiction'],
      },
    ];

    for (const tactic of tactics) {
      this.tacticLibrary.set(tactic.id, tactic);
    }
  }

  private initializeConstraintLibrary(): void {
    const constraints: MissionConstraint[] = [
      {
        id: 'constraint-rules-of-engagement',
        type: 'political',
        description: 'Strict rules of engagement limiting civilian casualties',
        impact: 'severe',
        mitigationStrategy: 'Use precision weapons and careful targeting',
      },
      {
        id: 'constraint-weather',
        type: 'environmental',
        description: 'Adverse weather conditions affecting air operations',
        impact: 'moderate',
        mitigationStrategy: 'Delay operations until weather improves',
      },
      {
        id: 'constraint-logistics',
        type: 'resource',
        description: 'Limited supply lines and ammunition',
        impact: 'severe',
        mitigationStrategy: 'Establish forward supply bases',
      },
      {
        id: 'constraint-political-timeline',
        type: 'temporal',
        description: 'Political decision deadline for mission conclusion',
        impact: 'moderate',
        mitigationStrategy: 'Accelerate key operations',
      },
    ];

    for (const constraint of constraints) {
      this.constraintLibrary.set(constraint.id, constraint);
    }
  }

  createMissionPlan(objectives: MissionObjective[], constraintIds: string[]): MissionPlan {
    const planId = `plan-${Date.now()}`;

    const constraints = constraintIds
      .map((id) => this.constraintLibrary.get(id))
      .filter((c) => c !== undefined) as MissionConstraint[];

    const now = Date.now();
    const estimatedDuration = objectives.reduce((sum, obj) => {
      if (!obj.deadline) return sum;
      const objDuration = typeof obj.deadline === 'number'
        ? Math.max(0, obj.deadline - now)
        : 3600;
      return sum + objDuration;
    }, 0);

    const plan: MissionPlan = {
      planId,
      objectives,
      constraints,
      tactics: [],
      assignedResources: [],
      ruleOfEngagement: this.generateRulesOfEngagement(objectives),
      estimatedDuration,
      acceptedRisks: [],
      contingencyPlans: [],
      status: 'draft',
    };

    this.missions.set(planId, { plan });
    return plan;
  }

  private generateRulesOfEngagement(objectives: MissionObjective[]): string[] {
    const roe: string[] = [
      'Minimize civilian casualties',
      'Protect friendly forces first',
      'Comply with international law',
      'Report all incidents',
    ];

    if (objectives.some((o) => o.priority === 'critical')) {
      roe.push('Escalate force authorization for critical objectives');
    }

    return roe;
  }

  addTacticToPlan(planId: string, tacticId: string): boolean {
    const mission = this.missions.get(planId);
    const tactic = this.tacticLibrary.get(tacticId);

    if (!mission || !tactic) return false;

    mission.plan.tactics.push(tactic);
    return true;
  }

  assignResourceToPlan(planId: string, resourceId: string, role: string): boolean {
    const mission = this.missions.get(planId);
    if (!mission) return false;

    mission.plan.assignedResources.push({ resourceId, role });
    return true;
  }

  acceptRisk(planId: string, riskDescription: string): void {
    const mission = this.missions.get(planId);
    if (mission) {
      mission.plan.acceptedRisks.push(riskDescription);
    }
  }

  approvePlan(planId: string, approver: string): boolean {
    const mission = this.missions.get(planId);
    if (!mission || mission.plan.status !== 'pending_approval') return false;

    mission.plan.approvedBy = approver;
    mission.plan.approvalTime = Date.now();
    mission.plan.status = 'approved';
    return true;
  }

  rejectPlan(planId: string, reason: string): boolean {
    const mission = this.missions.get(planId);
    if (!mission) return false;

    mission.plan.status = 'rejected';
    return true;
  }

  beginMissionExecution(planId: string): MissionExecution | null {
    const mission = this.missions.get(planId);
    if (!mission || mission.plan.status !== 'approved') return null;

    const execution: MissionExecution = {
      executionId: `exec-${Date.now()}`,
      planId,
      startTime: Date.now(),
      status: 'in_progress',
      executedTactics: mission.plan.tactics.map((t) => ({
        tacticId: t.id,
        startTime: Date.now(),
        status: 'pending',
      })),
      logs: [
        {
          timestamp: Date.now(),
          level: 'info',
          message: `Mission execution started for plan ${planId}`,
        },
      ],
      resourcesUsed: {},
      objectivesAchieved: [],
    };

    mission.execution = execution;
    return execution;
  }

  updateTacticStatus(
    planId: string,
    tacticId: string,
    status: 'success' | 'failed',
    issues?: string[],
  ): boolean {
    const mission = this.missions.get(planId);
    if (!mission || !mission.execution) return false;

    const executed = mission.execution.executedTactics.find((t) => t.tacticId === tacticId);
    if (!executed) return false;

    executed.status = status;
    executed.endTime = Date.now();
    executed.actualDuration = executed.endTime - executed.startTime;
    if (issues) executed.issues = issues;

    mission.execution.logs.push({
      timestamp: Date.now(),
      level: status === 'failed' ? 'error' : 'info',
      message: `Tactic ${tacticId} completed with status ${status}`,
    });

    return true;
  }

  completeMissionExecution(planId: string, objectiveIds: string[]): boolean {
    const mission = this.missions.get(planId);
    if (!mission || !mission.execution) return false;

    mission.execution.endTime = Date.now();
    mission.execution.status = 'completed';
    mission.execution.objectivesAchieved = objectiveIds;

    mission.execution.logs.push({
      timestamp: Date.now(),
      level: 'info',
      message: `Mission execution completed - ${objectiveIds.length} objectives achieved`,
    });

    return true;
  }

  conductDebrief(
    planId: string,
    executionId: string,
    conductedBy: string,
    findings: {
      missionSuccess: boolean;
      lessonsLearned: string[];
      recommendedImprovements: string[];
      successFactors: string[];
      keyMetrics: Record<string, number>;
    },
  ): MissionDebrief {
    const mission = this.missions.get(planId);
    if (!mission || !mission.execution) {
      throw new Error('Mission not found');
    }

    const execution = mission.execution;
    const objectives = mission.plan.objectives;

    const debrief: MissionDebrief = {
      debriefId: `debrief-${Date.now()}`,
      executionId,
      conductedBy,
      conductedAt: Date.now(),
      missionSuccess: findings.missionSuccess,
      objectivesAchieved: execution.objectivesAchieved.length,
      objectivesFailed: objectives.length - execution.objectivesAchieved.length,
      lessonsLearned: findings.lessonsLearned,
      recommendedImprovements: findings.recommendedImprovements,
      resourcesOverrun: [],
      delayedPhases: execution.executedTactics
        .filter((t) => {
          const tactic = this.tacticLibrary.get(t.tacticId);
          return tactic && t.actualDuration ? t.actualDuration > tactic.estimatedDuration : false;
        })
        .map((t) => t.tacticId),
      successFactors: findings.successFactors,
      failures: execution.executedTactics
        .filter((t) => t.status === 'failed')
        .map((t) => ({
          tacticId: t.tacticId,
          cause: t.issues?.[0] || 'Unknown',
          impact: 'moderate',
          recommendation: `Review and revise tactic ${t.tacticId}`,
        })),
      overallEffectiveness: findings.keyMetrics['effectiveness'] || 0,
      keyMetrics: findings.keyMetrics,
      nextActions: [],
    };

    mission.debrief = debrief;
    return debrief;
  }

  getMissionStatus(planId: string): {
    planStatus: string;
    executionStatus?: string;
    debriefStatus?: string;
  } | null {
    const mission = this.missions.get(planId);
    if (!mission) return null;

    return {
      planStatus: mission.plan.status,
      executionStatus: mission.execution?.status,
      debriefStatus: mission.debrief?.debriefId ? 'completed' : undefined,
    };
  }

  getMissionPlan(planId: string): MissionPlan | null {
    return this.missions.get(planId)?.plan || null;
  }

  getMissionExecution(planId: string): MissionExecution | null {
    return this.missions.get(planId)?.execution || null;
  }

  getMissionDebrief(planId: string): MissionDebrief | null {
    return this.missions.get(planId)?.debrief || null;
  }

  getTacticLibrary(): MissionTactic[] {
    return Array.from(this.tacticLibrary.values());
  }

  getConstraintLibrary(): MissionConstraint[] {
    return Array.from(this.constraintLibrary.values());
  }

  getMissionStats() {
    return {
      totalMissions: this.missions.size,
      plannedMissions: Array.from(this.missions.values()).filter(
        (m) => m.plan.status === 'approved' && !m.execution,
      ).length,
      executingMissions: Array.from(this.missions.values()).filter(
        (m) => m.execution && m.execution.status === 'in_progress',
      ).length,
      completedMissions: Array.from(this.missions.values()).filter((m) => m.debrief).length,
    };
  }
}
