/**
 * @file AlertOrchestrator.ts
 * @description Advanced multi-source alert correlation and deduplication.
 * Intelligently routes, enriches, and aggregates alerts across the system.
 */

import { SemanticStore } from '@/core/semantic/semanticStore';

export interface AlertInput {
  id: string;
  sourcePluginId: string;
  entityId: string;
  type: string; // 'threat', 'anomaly', 'fusion', 'threshold'
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

export interface Alert {
  id: string;
  sourceAlertIds: string[]; // Deduplicated source IDs
  aggregatedCount: number; // How many alerts were merged
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityId: string;
  enrichedContext: Record<string, unknown>;
  createdAt: number;
  lastSeen: number;
  status: 'active' | 'escalated' | 'suppressed' | 'resolved';
  escalationLevel: number;
  routes: string[];
}

export interface AlertDeduplicationConfig {
  timeWindow: number; // ms to look back for similar alerts
  entityProximity: number; // km threshold
  similarityThreshold: number; // 0-1
}

export interface AlertRoute {
  name: string;
  condition: (alert: Alert) => boolean;
  targets: string[]; // 'slack', 'pagerduty', 'email', 'webhook'
  delayMs: number;
}

/**
 * Advanced alert orchestrator with deduplication and enrichment.
 */
export class AlertOrchestrator {
  private store: SemanticStore;
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private deduplicationConfig: AlertDeduplicationConfig = {
    timeWindow: 300000, // 5 minutes
    entityProximity: 10, // km
    similarityThreshold: 0.75,
  };
  private routes: AlertRoute[] = [];
  private maxAlerts = 10000;

  constructor(store: SemanticStore) {
    this.store = store;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.routes = [
      {
        name: 'critical-immediate',
        condition: (alert) => alert.severity === 'critical' && alert.escalationLevel < 2,
        targets: ['pagerduty', 'slack'],
        delayMs: 0,
      },
      {
        name: 'high-escalate',
        condition: (alert) => alert.severity === 'high' && alert.lastSeen - alert.createdAt > 60000,
        targets: ['slack', 'email'],
        delayMs: 30000,
      },
      {
        name: 'medium-batch',
        condition: (alert) => alert.severity === 'medium' && alert.aggregatedCount > 3,
        targets: ['slack'],
        delayMs: 60000,
      },
      {
        name: 'low-dashboard',
        condition: (alert) => alert.severity === 'low',
        targets: ['webhook'],
        delayMs: 300000,
      },
    ];
  }

  /**
   * Process incoming alert (with deduplication).
   */
  async ingestAlert(input: AlertInput): Promise<Alert> {
    // Check for duplicate/similar alerts
    const duplicate = this.findDuplicate(input);

    if (duplicate) {
      // Merge with existing alert
      duplicate.sourceAlertIds.push(input.id);
      duplicate.aggregatedCount++;
      duplicate.lastSeen = input.timestamp;
      duplicate.escalationLevel = Math.min(3, duplicate.escalationLevel + 0.1);

      return duplicate;
    }

    // Create new alert
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sourceAlertIds: [input.id],
      aggregatedCount: 1,
      type: input.type,
      severity: input.severity,
      title: input.title,
      description: input.description,
      entityId: input.entityId,
      enrichedContext: input.context ?? {},
      createdAt: input.timestamp,
      lastSeen: input.timestamp,
      status: 'active',
      escalationLevel: this.getInitialEscalation(input.severity),
      routes: [],
    };

    // Enrich alert with semantic context
    await this.enrichAlert(alert);

    // Determine routing
    alert.routes = this.determineRoutes(alert);

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    if (this.alertHistory.length > this.maxAlerts) {
      const old = this.alertHistory.shift();
      if (old) {
        this.activeAlerts.delete(old.id);
      }
    }

    return alert;
  }

  /**
   * Find duplicate or similar alert within time window.
   */
  private findDuplicate(input: AlertInput): Alert | null {
    const timeWindowStart = input.timestamp - this.deduplicationConfig.timeWindow;

    for (const alert of this.activeAlerts.values()) {
      // Skip if alert is too old
      if (alert.lastSeen < timeWindowStart) continue;

      // Same entity and type
      if (alert.entityId === input.entityId && alert.type === input.type) {
        // Check similarity
        const similarity = this.computeSimilarity(alert, input);
        if (similarity > this.deduplicationConfig.similarityThreshold) {
          return alert;
        }
      }

      // Related entities nearby
      const proximity = this.computeProximity(alert.entityId, input.entityId);
      if (
        proximity < this.deduplicationConfig.entityProximity &&
        alert.type === input.type &&
        alert.severity === input.severity
      ) {
        const similarity = this.computeSimilarity(alert, input);
        if (similarity > this.deduplicationConfig.similarityThreshold) {
          return alert;
        }
      }
    }

    return null;
  }

  /**
   * Compute string similarity (Levenshtein ratio).
   */
  private computeSimilarity(alert: Alert, input: AlertInput): number {
    const titleDist = this.levenshteinDistance(alert.title, input.title);
    const maxLen = Math.max(alert.title.length, input.title.length);
    return 1 - titleDist / (maxLen || 1);
  }

  /**
   * Compute distance between two entities.
   */
  private computeProximity(entityId1: string, entityId2: string): number {
    // Simplified - in production, query entity positions from store
    const [plugin1, id1] = entityId1.split('|');
    const [plugin2, id2] = entityId2.split('|');

    const entity1 = this.store.getEntity?.(plugin1, id1);
    const entity2 = this.store.getEntity?.(plugin2, id2);

    if (!entity1 || !entity2 || !entity1.latitude || !entity2.latitude) {
      return Infinity;
    }

    // Haversine distance
    const R = 6371; // km
    const dLat = ((entity2.latitude - entity1.latitude) * Math.PI) / 180;
    const dLon = ((entity2.longitude - entity1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((entity1.latitude * Math.PI) / 180) *
        Math.cos((entity2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Enrich alert with semantic context.
   */
  private async enrichAlert(alert: Alert): Promise<void> {
    const [pluginId, entityId] = alert.entityId.split('|');

    // Get entity classification
    const classification = this.store.getClassification?.(pluginId, entityId);
    if (classification) {
      alert.enrichedContext.entityType = classification.type;
      alert.enrichedContext.disposition = classification.disposition;
    }

    // Get threat assessment
    const threat = this.store.getThreatAssessment?.(pluginId, entityId);
    if (threat) {
      alert.enrichedContext.threatLevel = threat.threatLevel;
      alert.enrichedContext.hostilityScore = threat.hostilityScore;
    }

    // Get related entities
    const relationships = this.store.getRelationshipsFrom?.(pluginId, entityId);
    if (relationships) {
      alert.enrichedContext.relatedEntities = relationships.map((r) => r.targetId);
    }
  }

  /**
   * Determine routing targets for alert.
   */
  private determineRoutes(alert: Alert): string[] {
    const routes = new Set<string>();

    for (const route of this.routes) {
      if (route.condition(alert)) {
        for (const target of route.targets) {
          routes.add(target);
        }
      }
    }

    return Array.from(routes);
  }

  private getInitialEscalation(severity: string): number {
    switch (severity) {
      case 'critical':
        return 2;
      case 'high':
        return 1.5;
      case 'medium':
        return 1;
      case 'low':
      default:
        return 0;
    }
  }

  /**
   * Resolve an active alert.
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
    }
  }

  /**
   * Suppress an alert temporarily.
   */
  suppressAlert(alertId: string, durationMs: number): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'suppressed';
      setTimeout(() => {
        if (alert.status === 'suppressed') {
          alert.status = 'active';
        }
      }, durationMs);
    }
  }

  /**
   * Get active alerts.
   */
  getActiveAlerts(severity?: string): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter((a) => a.status === 'active' && (!severity || a.severity === severity))
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity as keyof typeof severityOrder] -
          severityOrder[b.severity as keyof typeof severityOrder];
      });
  }

  /**
   * Get alert statistics.
   */
  getStats(): {
    activeCount: number;
    criticalCount: number;
    highCount: number;
    totalDeduplicatedFrom: number;
  } {
    let totalDeduplicatedFrom = 0;
    let criticalCount = 0;
    let highCount = 0;

    for (const alert of this.activeAlerts.values()) {
      if (alert.status === 'active') {
        totalDeduplicatedFrom += alert.sourceAlertIds.length - 1;
        if (alert.severity === 'critical') criticalCount++;
        if (alert.severity === 'high') highCount++;
      }
    }

    return {
      activeCount: Array.from(this.activeAlerts.values()).filter((a) => a.status === 'active').length,
      criticalCount,
      highCount,
      totalDeduplicatedFrom,
    };
  }
}
