/**
 * @file AlertChannelManager.ts
 * @description Manages alert channels with health checks and circuit breaker pattern.
 */

import { AlertChannelSlack } from './AlertChannelSlack';
import { AlertChannelPagerDuty } from './AlertChannelPagerDuty';
import { AlertChannelEmail } from './AlertChannelEmail';
import { AlertChannelWebhook } from './AlertChannelWebhook';

export interface ChannelMetrics {
  name: string;
  status: 'healthy' | 'degraded' | 'circuit-open';
  successCount: number;
  failureCount: number;
  successRate: number;
  lastError?: string;
  lastErrorTime?: number;
  consecutiveFailures: number;
}

/**
 * Manages all alert channels with health monitoring and circuit breaker.
 */
export class AlertChannelManager {
  private channels: Map<string, any> = new Map();
  private metrics: Map<string, ChannelMetrics> = new Map();
  private circuitBreakers: Map<string, boolean> = new Map(); // true = circuit open
  private failureThreshold = 3; // Open circuit after 3 consecutive failures
  private resetTimeout = 60000; // 1 minute before attempting reset

  /**
   * Initialize all configured channels.
   */
  async initialize(): Promise<void> {
    // Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      const slack = new AlertChannelSlack(process.env.SLACK_WEBHOOK_URL);
      const isHealthy = await slack.verify();
      this.channels.set('slack', slack);
      this.initializeMetrics('slack', isHealthy);
    }

    // PagerDuty
    if (process.env.PAGERDUTY_API_KEY && process.env.PAGERDUTY_ROUTING_KEY) {
      const pd = new AlertChannelPagerDuty(process.env.PAGERDUTY_API_KEY, process.env.PAGERDUTY_ROUTING_KEY);
      const isHealthy = await pd.verify();
      this.channels.set('pagerduty', pd);
      this.initializeMetrics('pagerduty', isHealthy);
    }

    // Email
    if (process.env.EMAIL_SMTP_HOST && process.env.EMAIL_FROM) {
      const email = new AlertChannelEmail({
        smtpHost: process.env.EMAIL_SMTP_HOST,
        smtpPort: parseInt(process.env.EMAIL_SMTP_PORT ?? '587'),
        from: process.env.EMAIL_FROM,
        recipients: process.env.EMAIL_RECIPIENTS?.split(',') || [],
      });
      const isHealthy = await email.verify();
      this.channels.set('email', email);
      this.initializeMetrics('email', isHealthy);
    }

    // Webhooks from environment (comma-separated)
    if (process.env.WEBHOOK_URLS) {
      const urls = process.env.WEBHOOK_URLS.split(',').map((u) => u.trim());
      for (let i = 0; i < urls.length; i++) {
        const webhook = new AlertChannelWebhook(urls[i]);
        const isHealthy = await webhook.verify();
        const name = `webhook-${i}`;
        this.channels.set(name, webhook);
        this.initializeMetrics(name, isHealthy);
      }
    }

    console.log(`Initialized ${this.channels.size} alert channels`);
  }

  private initializeMetrics(name: string, isHealthy: boolean): void {
    this.metrics.set(name, {
      name,
      status: isHealthy ? 'healthy' : 'degraded',
      successCount: 0,
      failureCount: 0,
      successRate: 1.0,
      consecutiveFailures: 0,
    });
    this.circuitBreakers.set(name, false);
  }

  /**
   * Send alert to a specific channel.
   */
  async sendToChannel(
    channelName: string,
    alertId: string,
    alert: any,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      return {
        success: false,
        error: `Channel not configured: ${channelName}`,
      };
    }

    const metrics = this.metrics.get(channelName);
    if (!metrics) {
      return {
        success: false,
        error: `Metrics not initialized for: ${channelName}`,
      };
    }

    // Check circuit breaker
    if (this.circuitBreakers.get(channelName)) {
      metrics.status = 'circuit-open';
      return {
        success: false,
        error: `Circuit breaker open for ${channelName}. Channel temporarily disabled.`,
      };
    }

    try {
      const result = await channel.send(alertId, alert);

      if (result.success) {
        // Success: reset failure counter
        metrics.successCount++;
        metrics.consecutiveFailures = 0;
        metrics.status = 'healthy';
        this.updateSuccessRate(channelName);

        return result;
      } else {
        // Failure: increment counter
        metrics.failureCount++;
        metrics.consecutiveFailures++;
        metrics.lastError = result.error;
        metrics.lastErrorTime = Date.now();

        // Check if we should open circuit
        if (metrics.consecutiveFailures >= this.failureThreshold) {
          this.circuitBreakers.set(channelName, true);
          metrics.status = 'circuit-open';
          console.error(`Circuit breaker opened for ${channelName} after ${this.failureThreshold} failures`);

          // Schedule circuit breaker reset
          setTimeout(() => {
            this.circuitBreakers.set(channelName, false);
            metrics.status = 'degraded';
            metrics.consecutiveFailures = 0;
            console.log(`Circuit breaker reset for ${channelName}`);
          }, this.resetTimeout);
        } else {
          metrics.status = 'degraded';
        }

        this.updateSuccessRate(channelName);
        return result;
      }
    } catch (error) {
      metrics.failureCount++;
      metrics.consecutiveFailures++;
      metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      metrics.lastErrorTime = Date.now();
      metrics.status = 'degraded';

      if (metrics.consecutiveFailures >= this.failureThreshold) {
        this.circuitBreakers.set(channelName, true);
        metrics.status = 'circuit-open';

        setTimeout(() => {
          this.circuitBreakers.set(channelName, false);
          metrics.status = 'degraded';
          metrics.consecutiveFailures = 0;
        }, this.resetTimeout);
      }

      this.updateSuccessRate(channelName);

      return {
        success: false,
        error: metrics.lastError,
      };
    }
  }

  private updateSuccessRate(channelName: string): void {
    const metrics = this.metrics.get(channelName);
    if (!metrics) return;

    const total = metrics.successCount + metrics.failureCount;
    metrics.successRate = total > 0 ? metrics.successCount / total : 1.0;
  }

  /**
   * Get all channel metrics.
   */
  getMetrics(): ChannelMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific channel metrics.
   */
  getChannelMetrics(channelName: string): ChannelMetrics | null {
    return this.metrics.get(channelName) ?? null;
  }

  /**
   * Get list of healthy channels.
   */
  getHealthyChannels(): string[] {
    const healthy: string[] = [];
    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.status === 'healthy' && !this.circuitBreakers.get(name)) {
        healthy.push(name);
      }
    }
    return healthy;
  }

  /**
   * Get list of available channels (not circuit-open).
   */
  getAvailableChannels(): string[] {
    const available: string[] = [];
    for (const [name] of this.channels.entries()) {
      if (!this.circuitBreakers.get(name)) {
        available.push(name);
      }
    }
    return available;
  }

  /**
   * Check if channel is configured.
   */
  isConfigured(channelName: string): boolean {
    return this.channels.has(channelName);
  }

  /**
   * Get health summary.
   */
  getHealth(): {
    healthy: number;
    degraded: number;
    circuitOpen: number;
    total: number;
  } {
    let healthy = 0;
    let degraded = 0;
    let circuitOpen = 0;

    for (const metrics of this.metrics.values()) {
      if (metrics.status === 'healthy') healthy++;
      else if (metrics.status === 'degraded') degraded++;
      else if (metrics.status === 'circuit-open') circuitOpen++;
    }

    return {
      healthy,
      degraded,
      circuitOpen,
      total: this.metrics.size,
    };
  }

  /**
   * Register a custom channel.
   */
  registerChannel(name: string, channel: any): void {
    this.channels.set(name, channel);
    this.initializeMetrics(name, true);
  }

  /**
   * Unregister a channel.
   */
  unregisterChannel(name: string): void {
    this.channels.delete(name);
    this.metrics.delete(name);
    this.circuitBreakers.delete(name);
  }

  /**
   * Get all configured channel names.
   */
  getChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Singleton instance
let instance: AlertChannelManager | null = null;

export function getAlertChannelManager(): AlertChannelManager {
  if (!instance) {
    instance = new AlertChannelManager();
  }
  return instance;
}

export async function initializeAlertChannels(): Promise<AlertChannelManager> {
  const manager = getAlertChannelManager();
  await manager.initialize();
  return manager;
}
