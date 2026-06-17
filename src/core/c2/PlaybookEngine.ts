/**
 * @file PlaybookEngine.ts
 * @description Mission automation and playbook execution engine.
 * Orchestrates multi-step automated responses and workflows.
 */

import { PrismaClient } from '@prisma/client';
import { C2CommandExecutor } from './C2CommandExecutor';

export interface PlaybookAction {
  id: string;
  type: 'command' | 'condition' | 'delay' | 'notification' | 'parallel';
  commandId?: string;
  parameters?: Record<string, any>;
  condition?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  delayMs?: number;
  notificationMessage?: string;
  parallelActions?: PlaybookAction[];
  onError?: 'continue' | 'abort' | 'retry';
  retries?: number;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  actions: PlaybookAction[];
  trigger?: {
    type: 'manual' | 'automatic';
    condition?: string; // e.g., "threatLevel > 0.8"
  };
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MissionExecution {
  id: string;
  playbookId: string;
  entityId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'paused';
  startTime: number;
  endTime?: number;
  duration?: number;
  actions: Array<{
    actionId: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    result?: any;
    error?: string;
    duration?: number;
  }>;
  logs: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
    actionId?: string;
  }>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'threat_level' | 'alert_type' | 'status_change' | 'time_based';
    threshold?: number;
    alertType?: string;
    status?: string;
    schedule?: string; // cron expression
  };
  action: {
    playbookId: string;
    parameters?: Record<string, any>;
  };
  scope: {
    entityIds?: string[];
    platformTypes?: string[];
    threatLevelRange?: [number, number];
  };
  enabled: boolean;
  createdAt: number;
}

export class PlaybookEngine {
  private db: PrismaClient;
  private commandExecutor: C2CommandExecutor;
  private playbooks: Map<string, Playbook> = new Map();
  private executions: Map<string, MissionExecution> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private tenantId?: string;

  constructor(db: PrismaClient, commandExecutor: C2CommandExecutor, tenantId?: string) {
    this.db = db;
    this.commandExecutor = commandExecutor;
    this.tenantId = tenantId;
  }

  /**
   * Create a new playbook.
   */
  createPlaybook(playbook: Omit<Playbook, 'createdAt' | 'updatedAt'>): Playbook {
    const now = Date.now();
    const newPlaybook: Playbook = {
      ...playbook,
      createdAt: now,
      updatedAt: now,
    };

    this.playbooks.set(playbook.id, newPlaybook);
    return newPlaybook;
  }

  /**
   * Get playbook by ID.
   */
  getPlaybook(playbookId: string): Playbook | undefined {
    return this.playbooks.get(playbookId);
  }

  /**
   * List all playbooks.
   */
  listPlaybooks(): Playbook[] {
    return Array.from(this.playbooks.values());
  }

  /**
   * Update playbook.
   */
  updatePlaybook(playbookId: string, updates: Partial<Playbook>): Playbook | undefined {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) return undefined;

    const updated = {
      ...playbook,
      ...updates,
      updatedAt: Date.now(),
    };

    this.playbooks.set(playbookId, updated);
    return updated;
  }

  /**
   * Delete playbook.
   */
  deletePlaybook(playbookId: string): boolean {
    return this.playbooks.delete(playbookId);
  }

  /**
   * Execute playbook on entity.
   */
  async executePlaybook(playbookId: string, entityId: string): Promise<MissionExecution> {
    const playbook = this.getPlaybook(playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    const executionId = `exec-${playbookId}-${entityId}-${Date.now()}`;
    const execution: MissionExecution = {
      id: executionId,
      playbookId,
      entityId,
      status: 'pending',
      startTime: Date.now(),
      actions: playbook.actions.map((action) => ({
        actionId: action.id,
        status: 'pending',
      })),
      logs: [
        {
          timestamp: Date.now(),
          level: 'info',
          message: `Starting playbook execution: ${playbook.name}`,
        },
      ],
    };

    this.executions.set(executionId, execution);

    // Execute playbook asynchronously
    this.executeActions(execution, playbook.actions, entityId).catch((error) => {
      this.logToExecution(execution, 'error', `Playbook execution failed: ${error.message}`);
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
    });

    return execution;
  }

  /**
   * Execute playbook actions recursively.
   */
  private async executeActions(
    execution: MissionExecution,
    actions: PlaybookAction[],
    entityId: string,
  ): Promise<void> {
    execution.status = 'running';

    for (const action of actions) {
      const actionExecution = execution.actions.find((a) => a.actionId === action.id);
      if (!actionExecution) continue;

      try {
        actionExecution.status = 'running';
        const startTime = Date.now();

        switch (action.type) {
          case 'command':
            await this.executeCommandAction(action, entityId, execution);
            break;

          case 'delay':
            await this.executeDelayAction(action, execution);
            break;

          case 'condition':
            await this.executeConditionAction(action, execution);
            break;

          case 'notification':
            await this.executeNotificationAction(action, execution);
            break;

          case 'parallel':
            await this.executeParallelActions(action, entityId, execution);
            break;

          default:
            throw new Error(`Unknown action type: ${action.type}`);
        }

        actionExecution.status = 'success';
        actionExecution.duration = Date.now() - startTime;
        this.logToExecution(execution, 'success', `Action completed: ${action.id}`);
      } catch (error) {
        actionExecution.status = 'failed';
        actionExecution.error = error instanceof Error ? error.message : String(error);
        this.logToExecution(execution, 'error', `Action failed: ${actionExecution.error}`);

        if (action.onError === 'abort') {
          execution.status = 'failed';
          break;
        } else if (action.onError === 'retry' && action.retries && action.retries > 0) {
          action.retries--;
          // Retry this action
          continue;
        }
      }
    }

    execution.status = 'success';
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;
    this.logToExecution(execution, 'success', 'Playbook execution completed');
  }

  /**
   * Execute command action.
   */
  private async executeCommandAction(
    action: PlaybookAction,
    entityId: string,
    execution: MissionExecution,
  ): Promise<void> {
    if (!action.commandId) {
      throw new Error('Command ID is required for command action');
    }

    const result = await this.commandExecutor.execute({
      commandId: action.commandId,
      entityId,
      parameters: action.parameters,
    });

    if (result.status !== 'success') {
      throw new Error(result.error || 'Command execution failed');
    }

    const actionExecution = execution.actions.find((a) => a.actionId === action.id);
    if (actionExecution) {
      actionExecution.result = result.result;
    }
  }

  /**
   * Execute delay action.
   */
  private executeDelayAction(action: PlaybookAction, execution: MissionExecution): Promise<void> {
    return new Promise((resolve) => {
      const delayMs = action.delayMs || 1000;
      this.logToExecution(execution, 'info', `Delaying for ${delayMs}ms`);
      setTimeout(resolve, delayMs);
    });
  }

  /**
   * Execute condition action.
   */
  private async executeConditionAction(
    action: PlaybookAction,
    execution: MissionExecution,
  ): Promise<void> {
    if (!action.condition) {
      throw new Error('Condition is required for condition action');
    }

    // In a real implementation, would evaluate against entity state
    const conditionMet = this.evaluateCondition(action.condition);

    if (!conditionMet) {
      const actionExecution = execution.actions.find((a) => a.actionId === action.id);
      if (actionExecution) {
        actionExecution.status = 'skipped';
      }
      this.logToExecution(execution, 'info', `Condition not met: ${action.condition.field}`);
    }
  }

  /**
   * Execute notification action.
   */
  private async executeNotificationAction(
    action: PlaybookAction,
    execution: MissionExecution,
  ): Promise<void> {
    if (!action.notificationMessage) {
      throw new Error('Notification message is required');
    }

    this.logToExecution(execution, 'info', `Notification: ${action.notificationMessage}`);
    // In a real implementation, would send to notification system
  }

  /**
   * Execute parallel actions.
   */
  private async executeParallelActions(
    action: PlaybookAction,
    entityId: string,
    execution: MissionExecution,
  ): Promise<void> {
    if (!action.parallelActions || action.parallelActions.length === 0) {
      throw new Error('Parallel actions required');
    }

    this.logToExecution(execution, 'info', `Executing ${action.parallelActions.length} actions in parallel`);

    // Execute all parallel actions concurrently
    await Promise.all(action.parallelActions.map((parallelAction) =>
      this.executeActions(execution, [parallelAction], entityId),
    ));
  }

  /**
   * Evaluate condition logic.
   */
  private evaluateCondition(condition: PlaybookAction['condition']): boolean {
    if (!condition) return true;

    // Placeholder implementation
    // In production, would evaluate against actual entity state
    switch (condition.operator) {
      case 'equals':
        return condition.value === condition.value;
      case 'contains':
        return String(condition.value).includes(condition.value);
      case 'greater_than':
        return condition.value > condition.value;
      case 'less_than':
        return condition.value < condition.value;
      default:
        return true;
    }
  }

  /**
   * Get execution status.
   */
  getExecution(executionId: string): MissionExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * List executions.
   */
  listExecutions(playbookId?: string): MissionExecution[] {
    const executions = Array.from(this.executions.values());
    return playbookId ? executions.filter((e) => e.playbookId === playbookId) : executions;
  }

  /**
   * Create automation rule.
   */
  createAutomationRule(rule: Omit<AutomationRule, 'createdAt'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      createdAt: Date.now(),
    };

    this.automationRules.set(rule.id, newRule);
    return newRule;
  }

  /**
   * Get automation rule.
   */
  getAutomationRule(ruleId: string): AutomationRule | undefined {
    return this.automationRules.get(ruleId);
  }

  /**
   * List automation rules.
   */
  listAutomationRules(): AutomationRule[] {
    return Array.from(this.automationRules.values());
  }

  /**
   * Disable automation rule.
   */
  disableAutomationRule(ruleId: string): void {
    const rule = this.automationRules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  /**
   * Check triggers and execute matching playbooks.
   */
  async evaluateAutomationRules(entityId: string, threatLevel: number, status: string): Promise<void> {
    const applicableRules = Array.from(this.automationRules.values()).filter(
      (rule) => rule.enabled && this.matchesScope(rule, entityId, threatLevel),
    );

    for (const rule of applicableRules) {
      const triggerMatches = this.evaluateTrigger(rule.trigger, threatLevel, status);

      if (triggerMatches) {
        const playbook = this.getPlaybook(rule.action.playbookId);
        if (playbook) {
          this.logAutomation(`Executing playbook ${rule.action.playbookId} for entity ${entityId} via rule ${rule.id}`);
          await this.executePlaybook(rule.action.playbookId, entityId);
        }
      }
    }
  }

  /**
   * Check if entity matches rule scope.
   */
  private matchesScope(rule: AutomationRule, entityId: string, threatLevel: number): boolean {
    const { scope } = rule;

    if (scope.entityIds && !scope.entityIds.includes(entityId)) {
      return false;
    }

    if (scope.threatLevelRange) {
      const [min, max] = scope.threatLevelRange;
      if (threatLevel < min || threatLevel > max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate automation rule trigger.
   */
  private evaluateTrigger(
    trigger: AutomationRule['trigger'],
    threatLevel: number,
    status: string,
  ): boolean {
    switch (trigger.type) {
      case 'threat_level':
        return trigger.threshold !== undefined && threatLevel >= trigger.threshold;

      case 'status_change':
        return trigger.status === status;

      case 'alert_type':
        // Would compare against alert type
        return true;

      case 'time_based':
        // Would evaluate cron expression
        return false;

      default:
        return false;
    }
  }

  /**
   * Log to execution.
   */
  private logToExecution(
    execution: MissionExecution,
    level: 'info' | 'warn' | 'error' | 'success',
    message: string,
    actionId?: string,
  ): void {
    execution.logs.push({
      timestamp: Date.now(),
      level,
      message,
      actionId,
    });
  }

  /**
   * Log automation event.
   */
  private logAutomation(message: string): void {
    console.log(`[PlaybookEngine] ${message}`);
  }

  /**
   * Get engine statistics.
   */
  getStats(): {
    playbookCount: number;
    executionCount: number;
    automationRuleCount: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    const executions = Array.from(this.executions.values());

    return {
      playbookCount: this.playbooks.size,
      executionCount: executions.length,
      automationRuleCount: this.automationRules.size,
      successfulExecutions: executions.filter((e) => e.status === 'success').length,
      failedExecutions: executions.filter((e) => e.status === 'failed').length,
    };
  }
}
