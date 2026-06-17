/**
 * @file AnomalyDetectionWorker.ts
 * @description BullMQ worker for async anomaly detection and model training.
 */

import { Job } from 'bullmq';
import { AnomalyDetectionEngine, EntityBehavior } from '@/core/ml/AnomalyDetectionEngine';
import { SemanticStore } from '@/core/semantic/semanticStore';

export interface AnomalyDetectionJobData {
  type: 'train' | 'detect' | 'rebaseline';
  behaviors?: EntityBehavior[];
  modelVersion?: string;
  entityId?: string;
  pluginId?: string;
}

export interface AnomalyDetectionJobResult {
  success: boolean;
  type: string;
  duration: number;
  anomalies?: any[];
  modelMetrics?: any;
  error?: string;
}

/**
 * Anomaly detection worker - handles ML model training and detection.
 */
export class AnomalyDetectionWorker {
  private engine: AnomalyDetectionEngine;
  private store: SemanticStore;

  constructor(store: SemanticStore) {
    this.engine = new AnomalyDetectionEngine(store);
    this.store = store;
  }

  /**
   * Process anomaly detection jobs.
   */
  async process(job: Job<AnomalyDetectionJobData>): Promise<AnomalyDetectionJobResult> {
    const startTime = performance.now();
    const { type, behaviors, modelVersion, entityId, pluginId } = job.data;

    try {
      let result: any;

      switch (type) {
        case 'train':
          result = await this.handleTraining(behaviors || []);
          break;

        case 'detect':
          result = await this.handleDetection(behaviors || []);
          break;

        case 'rebaseline':
          result = await this.handleRebaseline(entityId, pluginId);
          break;

        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      const duration = performance.now() - startTime;

      return {
        success: true,
        type,
        duration,
        ...result,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`AnomalyDetectionWorker: Job ${job.id} failed:`, error);

      return {
        success: false,
        type,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle model training job.
   */
  private async handleTraining(behaviors: EntityBehavior[]): Promise<any> {
    if (behaviors.length === 0) {
      throw new Error('No behaviors provided for training');
    }

    // Record all behaviors to initialize baselines
    for (const behavior of behaviors) {
      this.engine.recordBehavior(behavior);
    }

    // Train the isolation forest model
    this.engine.trainModel();

    // Return model statistics
    const stats = this.engine.getStats();

    return {
      modelMetrics: {
        trainingDataSize: stats.trainingDataSize,
        baselineCount: stats.baselineCount,
        modelsCount: stats.modelsCount,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Handle anomaly detection job.
   */
  private async handleDetection(behaviors: EntityBehavior[]): Promise<any> {
    if (behaviors.length === 0) {
      throw new Error('No behaviors provided for detection');
    }

    // Detect anomalies in the batch
    const anomalyScores = this.engine.detectAnomalies(behaviors);

    // Filter to only anomalies above threshold
    const anomalies = anomalyScores.filter((score) => score.severity !== 'none');

    return {
      anomalies: anomalies.map((score) => ({
        entityId: score.entityId,
        score: score.score,
        severity: score.severity,
        indicators: score.indicators,
        baselineDeviation: score.baselineDeviation,
        timestamp: score.timestamp,
      })),
    };
  }

  /**
   * Handle rebaseline job - reset baseline for an entity.
   */
  private async handleRebaseline(entityId?: string, pluginId?: string): Promise<any> {
    if (!entityId || !pluginId) {
      throw new Error('entityId and pluginId required for rebaseline');
    }

    const baseline = this.engine.getBaseline(pluginId, entityId);

    return {
      modelMetrics: {
        baseline: baseline ? {
          entityId: baseline.entityId,
          pluginId: baseline.pluginId,
          mean: baseline.mean,
          stdDev: baseline.stdDev,
          sampleCount: baseline.sampleCount,
          lastUpdated: baseline.lastUpdated,
        } : null,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Get engine instance for direct access.
   */
  getEngine(): AnomalyDetectionEngine {
    return this.engine;
  }

  /**
   * Get engine statistics.
   */
  getStats(): any {
    return this.engine.getStats();
  }
}

/**
 * Create the processor function for BullMQ.
 */
export function createAnomalyDetectionProcessor(store: SemanticStore) {
  const worker = new AnomalyDetectionWorker(store);

  return async (job: Job<AnomalyDetectionJobData>): Promise<AnomalyDetectionJobResult> => {
    return worker.process(job);
  };
}
