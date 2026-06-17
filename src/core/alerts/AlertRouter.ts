/**
 * @file AlertRouter.ts
 * @description Routes alerts to external systems based on severity and context.
 * Supports Slack, PagerDuty, Email, and webhook targets.
 */

export interface AlertRouteTarget {
  name: 'slack' | 'pagerduty' | 'email' | 'webhook';
  config: Record<string, any>;
}

export interface AlertRouteResult {
  target: string;
  success: boolean;
  timestamp: number;
  messageId?: string;
  error?: string;
}

/**
 * Routes alerts to configured external systems.
 */
export class AlertRouter {
  private targets: Map<string, AlertRouteTarget> = new Map();

  constructor() {
    this.initializeTargets();
  }

  private initializeTargets(): void {
    // Load from environment or config
    if (process.env.SLACK_WEBHOOK_URL) {
      this.targets.set('slack', {
        name: 'slack',
        config: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
      });
    }

    if (process.env.PAGERDUTY_API_KEY) {
      this.targets.set('pagerduty', {
        name: 'pagerduty',
        config: { apiKey: process.env.PAGERDUTY_API_KEY },
      });
    }

    if (process.env.EMAIL_SMTP_HOST) {
      this.targets.set('email', {
        name: 'email',
        config: {
          smtpHost: process.env.EMAIL_SMTP_HOST,
          smtpPort: process.env.EMAIL_SMTP_PORT,
          from: process.env.EMAIL_FROM,
          recipients: process.env.EMAIL_RECIPIENTS?.split(',') || [],
        },
      });
    }

    if (process.env.WEBHOOK_URL) {
      this.targets.set('webhook', {
        name: 'webhook',
        config: { url: process.env.WEBHOOK_URL },
      });
    }
  }

  /**
   * Route alert to specified targets.
   */
  async routeAlert(
    alertId: string,
    targets: string[],
    alert: {
      severity: string;
      title: string;
      description: string;
      entityId: string;
      enrichedContext: Record<string, any>;
    },
  ): Promise<AlertRouteResult[]> {
    const results: AlertRouteResult[] = [];

    for (const targetName of targets) {
      const target = this.targets.get(targetName);
      if (!target) {
        results.push({
          target: targetName,
          success: false,
          timestamp: Date.now(),
          error: `Target not configured: ${targetName}`,
        });
        continue;
      }

      try {
        const result = await this.sendToTarget(target, alertId, alert);
        results.push(result);
      } catch (error) {
        results.push({
          target: targetName,
          success: false,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private async sendToTarget(
    target: AlertRouteTarget,
    alertId: string,
    alert: any,
  ): Promise<AlertRouteResult> {
    switch (target.name) {
      case 'slack':
        return this.sendToSlack(target.config, alertId, alert);
      case 'pagerduty':
        return this.sendToPagerDuty(target.config, alertId, alert);
      case 'email':
        return this.sendEmail(target.config, alertId, alert);
      case 'webhook':
        return this.sendWebhook(target.config, alertId, alert);
      default:
        throw new Error(`Unknown target: ${target.name}`);
    }
  }

  private async sendToSlack(
    config: Record<string, any>,
    alertId: string,
    alert: any,
  ): Promise<AlertRouteResult> {
    const color = this.getSeverityColor(alert.severity);
    const payload = {
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.description,
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Alert ID', value: alertId, short: true },
            { title: 'Entity', value: alert.entityId, short: true },
            {
              title: 'Threat Level',
              value: alert.enrichedContext.threatLevel || 'unknown',
              short: true,
            },
          ],
          timestamp: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return {
      target: 'slack',
      success: true,
      timestamp: Date.now(),
      messageId: alertId,
    };
  }

  private async sendToPagerDuty(
    config: Record<string, any>,
    alertId: string,
    alert: any,
  ): Promise<AlertRouteResult> {
    const severity = this.mapToEventLogSeverity(alert.severity);
    const payload = {
      routing_key: config.routingKey,
      event_action: 'trigger',
      dedup_key: alertId,
      payload: {
        summary: alert.title,
        severity,
        source: alert.entityId,
        custom_details: {
          description: alert.description,
          threat_level: alert.enrichedContext.threatLevel,
        },
      },
    };

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token token=${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`PagerDuty API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return {
      target: 'pagerduty',
      success: true,
      timestamp: Date.now(),
      messageId: data.id,
    };
  }

  private async sendEmail(
    config: Record<string, any>,
    alertId: string,
    alert: any,
  ): Promise<AlertRouteResult> {
    // Placeholder for email implementation
    // In production, use nodemailer or similar
    console.log(`Email routing for alert ${alertId} not yet implemented`);
    return {
      target: 'email',
      success: false,
      timestamp: Date.now(),
      error: 'Email routing not yet implemented',
    };
  }

  private async sendWebhook(
    config: Record<string, any>,
    alertId: string,
    alert: any,
  ): Promise<AlertRouteResult> {
    const payload = {
      alertId,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      entityId: alert.entityId,
      enrichedContext: alert.enrichedContext,
      timestamp: Date.now(),
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }

    return {
      target: 'webhook',
      success: true,
      timestamp: Date.now(),
    };
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#FF0000';
      case 'high':
        return '#FF9900';
      case 'medium':
        return '#FFFF00';
      case 'low':
        return '#00FF00';
      default:
        return '#808080';
    }
  }

  private mapToEventLogSeverity(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Register custom target.
   */
  registerTarget(name: string, target: AlertRouteTarget): void {
    this.targets.set(name, target);
  }

  /**
   * Get configured targets.
   */
  getTargets(): string[] {
    return Array.from(this.targets.keys());
  }
}
