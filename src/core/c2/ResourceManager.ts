export interface ResourcePool {
  type: 'compute' | 'network' | 'storage' | 'security_clearance';
  total: number;
  allocated: number;
  reserved: number;
}

export interface ResourceAllocation {
  allocationId: string;
  executionId: string;
  entityId: string;
  resources: Record<string, number>;
  allocatedAt: number;
  releasedAt?: number;
  status: 'allocated' | 'released' | 'failed';
}

export interface ExecutionSchedule {
  executionId: string;
  playbookId: string;
  entityId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledTime: number;
  estimatedDuration: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  allocationId?: string;
}

export interface ConflictResolution {
  conflictId: string;
  executions: string[];
  resolutionStrategy: 'preemption' | 'queuing' | 'resource_scaling' | 'cancellation';
  selectedExecution: string;
  reason: string;
}

export class ResourceManager {
  private resourcePools: Map<string, ResourcePool> = new Map();
  private allocations: Map<string, ResourceAllocation> = new Map();
  private executionSchedules: Map<string, ExecutionSchedule> = new Map();
  private conflictLog: ConflictResolution[] = [];

  constructor() {
    this.initializeResourcePools();
  }

  private initializeResourcePools(): void {
    this.resourcePools.set('compute', {
      type: 'compute',
      total: 8,
      allocated: 0,
      reserved: 0,
    });
    this.resourcePools.set('network', {
      type: 'network',
      total: 10,
      allocated: 0,
      reserved: 0,
    });
    this.resourcePools.set('storage', {
      type: 'storage',
      total: 1000,
      allocated: 0,
      reserved: 0,
    });
    this.resourcePools.set('security_clearance', {
      type: 'security_clearance',
      total: 20,
      allocated: 0,
      reserved: 0,
    });
  }

  scheduleExecution(schedule: ExecutionSchedule): boolean {
    const now = Date.now();

    if (schedule.scheduledTime < now) {
      schedule.scheduledTime = now;
    }

    const existingSchedules = Array.from(this.executionSchedules.values()).filter(
      (s) => s.status === 'pending' || s.status === 'running',
    );

    const conflicts = this.detectConflicts(schedule, existingSchedules);

    if (conflicts.length > 0) {
      const resolution = this.resolveConflicts(schedule, conflicts);
      if (resolution.resolutionStrategy === 'cancellation') {
        return false;
      }
    }

    this.executionSchedules.set(schedule.executionId, schedule);
    return true;
  }

  private detectConflicts(
    newSchedule: ExecutionSchedule,
    existing: ExecutionSchedule[],
  ): ExecutionSchedule[] {
    const conflicts: ExecutionSchedule[] = [];
    const timeWindow = 5000;

    for (const schedule of existing) {
      const overlap =
        newSchedule.scheduledTime < schedule.scheduledTime + schedule.estimatedDuration &&
        newSchedule.scheduledTime + newSchedule.estimatedDuration > schedule.scheduledTime;

      if (overlap && newSchedule.entityId === schedule.entityId) {
        conflicts.push(schedule);
      }

      if (schedule.priority === 'critical' && newSchedule.priority !== 'critical') {
        if (
          Math.abs(newSchedule.scheduledTime - schedule.scheduledTime) <
          timeWindow
        ) {
          conflicts.push(schedule);
        }
      }
    }

    return conflicts;
  }

  private resolveConflicts(
    newSchedule: ExecutionSchedule,
    conflicts: ExecutionSchedule[],
  ): ConflictResolution {
    const conflictId = `conflict-${Date.now()}`;
    let resolutionStrategy: ConflictResolution['resolutionStrategy'] = 'queuing';
    let selectedExecution = newSchedule.executionId;
    let reason = '';

    if (newSchedule.priority === 'critical') {
      resolutionStrategy = 'preemption';
      selectedExecution = newSchedule.executionId;
      reason = 'New execution has critical priority';

      for (const conflict of conflicts) {
        if (conflict.priority !== 'critical') {
          conflict.status = 'cancelled';
        }
      }
    } else if (conflicts.some((c) => c.priority === 'critical')) {
      resolutionStrategy = 'cancellation';
      selectedExecution = conflicts[0].executionId;
      reason = 'Existing critical execution takes precedence';
    } else {
      resolutionStrategy = 'queuing';
      const conflictTimes = conflicts.map((c) => c.scheduledTime + c.estimatedDuration);
      const maxScheduledTime = conflictTimes.length > 0 ? Math.max(...conflictTimes) : newSchedule.scheduledTime;
      newSchedule.scheduledTime = maxScheduledTime + 1000;
      selectedExecution = newSchedule.executionId;
      reason = 'New execution queued after existing executions';
    }

    const resolution: ConflictResolution = {
      conflictId,
      executions: [newSchedule.executionId, ...conflicts.map((c) => c.executionId)],
      resolutionStrategy,
      selectedExecution,
      reason,
    };

    this.conflictLog.push(resolution);
    return resolution;
  }

  allocateResources(
    executionId: string,
    entityId: string,
    required: Record<string, number>,
  ): ResourceAllocation | null {
    const availableResources = this.getAvailableResources();
    const canAllocate = this.canAllocateResources(required, availableResources);

    if (!canAllocate) {
      return null;
    }

    const allocationId = `alloc-${Date.now()}`;
    const allocation: ResourceAllocation = {
      allocationId,
      executionId,
      entityId,
      resources: required,
      allocatedAt: Date.now(),
      status: 'allocated',
    };

    for (const [type, quantity] of Object.entries(required)) {
      const pool = this.resourcePools.get(type);
      if (pool) {
        pool.allocated += quantity;
      }
    }

    this.allocations.set(allocationId, allocation);
    return allocation;
  }

  releaseResources(allocationId: string): boolean {
    const allocation = this.allocations.get(allocationId);
    if (!allocation || allocation.status === 'released') {
      return false;
    }

    for (const [type, quantity] of Object.entries(allocation.resources)) {
      const pool = this.resourcePools.get(type);
      if (pool) {
        pool.allocated = Math.max(0, pool.allocated - quantity);
      }
    }

    allocation.releasedAt = Date.now();
    allocation.status = 'released';

    return true;
  }

  private getAvailableResources(): Record<string, number> {
    const available: Record<string, number> = {};

    for (const [type, pool] of this.resourcePools.entries()) {
      available[type] = pool.total - pool.allocated - pool.reserved;
    }

    return available;
  }

  private canAllocateResources(
    required: Record<string, number>,
    available: Record<string, number>,
  ): boolean {
    for (const [type, quantity] of Object.entries(required)) {
      if ((available[type] || 0) < quantity) {
        return false;
      }
    }
    return true;
  }

  getResourceUtilization(): Record<string, number> {
    const utilization: Record<string, number> = {};

    for (const [type, pool] of this.resourcePools.entries()) {
      utilization[type] = (pool.allocated / pool.total) * 100;
    }

    return utilization;
  }

  getExecutionStatus(executionId: string): ExecutionSchedule | null {
    return this.executionSchedules.get(executionId) || null;
  }

  updateExecutionStatus(
    executionId: string,
    status: ExecutionSchedule['status'],
  ): boolean {
    const schedule = this.executionSchedules.get(executionId);
    if (!schedule) {
      return false;
    }

    schedule.status = status;

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      if (schedule.allocationId) {
        this.releaseResources(schedule.allocationId);
      }
    }

    return true;
  }

  getPendingExecutions(): ExecutionSchedule[] {
    return Array.from(this.executionSchedules.values())
      .filter((s) => s.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.scheduledTime - b.scheduledTime;
      });
  }

  getRunningExecutions(): ExecutionSchedule[] {
    return Array.from(this.executionSchedules.values()).filter(
      (s) => s.status === 'running',
    );
  }

  getResourcePool(type: string): ResourcePool | null {
    return this.resourcePools.get(type) || null;
  }

  getAllResourcePools(): Record<string, ResourcePool> {
    const pools: Record<string, ResourcePool> = {};
    for (const [type, pool] of this.resourcePools.entries()) {
      pools[type] = { ...pool };
    }
    return pools;
  }

  getConflictHistory(): ConflictResolution[] {
    return [...this.conflictLog];
  }
}
