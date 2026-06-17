/**
 * @file queueInitializer.ts
 * @description Initialize all job queues and workers on application startup.
 */

import { getQueueManager, initializeQueueManager } from '@/core/queue/QueueManager';
import { createAnomalyDetectionProcessor } from '@/core/queue/workers/AnomalyDetectionWorker';
import { createAlertRoutingProcessor } from '@/core/queue/workers/AlertRoutingWorker';
import { getAlertChannelManager, initializeAlertChannels } from '@/core/alerts/AlertChannelManager';
import { prisma } from '@/lib/db';
import { SemanticStore } from '@/core/semantic/semanticStore';

/**
 * Initialize all queue infrastructure.
 */
export async function initializeQueues(semanticStore: SemanticStore): Promise<void> {
  console.log('🚀 Initializing queue system...');

  try {
    // 1. Initialize QueueManager
    const queueManager = await initializeQueueManager();

    // 2. Initialize AlertChannelManager
    const channelManager = await initializeAlertChannels();

    // 3. Register AnomalyDetectionWorker
    console.log('📊 Registering AnomalyDetectionWorker...');
    queueManager.registerWorker(
      'anomaly-detection',
      createAnomalyDetectionProcessor(semanticStore),
      {
        concurrency: 2,
        lockDuration: 60000,
        lockRenewTime: 30000,
      },
    );

    // 4. Register AlertRoutingWorker
    console.log('📮 Registering AlertRoutingWorker...');
    queueManager.registerWorker(
      'alert-routing',
      createAlertRoutingProcessor(prisma, channelManager),
      {
        concurrency: 5,
        lockDuration: 30000,
        lockRenewTime: 15000,
      },
    );

    // 5. Get initial stats
    const health = await queueManager.getHealth();
    console.log('✅ Queue system initialized');
    console.log(`   Redis: ${health.redis ? '✓' : '✗'}`);
    console.log(`   Queues: ${health.queues}`);
    console.log(`   Workers: ${health.workers}`);

    // 6. Log channel configuration
    const channels = channelManager.getChannelNames();
    console.log(`   Channels configured: ${channels.join(', ')}`);

    // 7. Set up periodic health checks
    setupHealthChecks(queueManager);
  } catch (error) {
    console.error('❌ Failed to initialize queue system:', error);
    throw error;
  }
}

/**
 * Set up periodic health checks and logging.
 */
function setupHealthChecks(queueManager: any): void {
  // Health check every 5 minutes
  setInterval(async () => {
    try {
      const health = await queueManager.getHealth();
      const stats = (await queueManager.getQueueStats()) as any[];

      console.log('📊 Queue Health Check:');
      console.log(`   Status: ${health.status}`);
      console.log(`   Queues: ${health.queues} | Workers: ${health.workers}`);
      console.log(`   Active jobs: ${health.jobs.active} | Waiting: ${health.jobs.waiting} | Failed: ${health.jobs.failed}`);

      // Log per-queue stats
      for (const stat of stats) {
        console.log(`   [${stat.name}] Waiting: ${stat.waiting}, Active: ${stat.active}, Failed: ${stat.failed}`);
      }
    } catch (error) {
      console.error('⚠️  Health check failed:', error);
    }
  }, 300000); // 5 minutes
}

/**
 * Enqueue an anomaly detection training job.
 */
export async function enqueueAnomalyTraining(behaviors: any[], modelVersion?: string): Promise<string> {
  const queueManager = getQueueManager();

  return queueManager.enqueueJob('anomaly-detection', {
    type: 'train',
    behaviors,
    modelVersion,
  });
}

/**
 * Enqueue an anomaly detection job.
 */
export async function enqueueAnomalyDetection(behaviors: any[]): Promise<string> {
  const queueManager = getQueueManager();

  return queueManager.enqueueJob('anomaly-detection', {
    type: 'detect',
    behaviors,
  });
}

/**
 * Enqueue an alert routing job.
 */
export async function enqueueAlertRouting(
  alertId: string,
  channels: string[],
  alert: any,
  tenantId?: string,
): Promise<string> {
  const queueManager = getQueueManager();

  return queueManager.enqueueJob('alert-routing', {
    alertId,
    tenantId,
    channels,
    alert,
  });
}

/**
 * Get queue manager instance.
 */
export function getQueues() {
  return getQueueManager();
}

/**
 * Shutdown all queues gracefully.
 */
export async function shutdownQueues(): Promise<void> {
  const queueManager = getQueueManager();
  await queueManager.shutdown();
}
