/**
 * @file AlertChannelSlack.ts
 * @description Slack webhook integration for alert routing.
 */

import { AlertRouteTarget } from './AlertRouter';

export interface SlackAlert {
  severity: string;
  title: string;
  description: string;
  entityId: string;
  enrichedContext: Record<string, any>;
  timestamp?: number;
}

/**
 * Slack message formatter for alerts.
 */
export class AlertChannelSlack {
  private webhookUrl: string;
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 5000]; // ms

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * Send alert to Slack.
   */
  async send(alertId: string, alert: SlackAlert): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const payload = this.formatMessage(alertId, alert);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          return {
            success: true,
            messageId: alertId,
          };
        }

        // Retry on 429 (rate limit) or 5xx errors
        if (response.status === 429 || response.status >= 500) {
          if (attempt < this.maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, this.retryDelays[attempt]));
            continue;
          }
        }

        return {
          success: false,
          error: `Slack API error: ${response.statusText}`,
        };
      } catch (error) {
        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelays[attempt]));
          continue;
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
    };
  }

  private formatMessage(alertId: string, alert: SlackAlert): Record<string, any> {
    const color = this.getSeverityColor(alert.severity);
    const threatLevel = alert.enrichedContext.threatLevel ?? 'unknown';
    const hostilityScore = alert.enrichedContext.hostilityScore ?? 0;

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 ${alert.severity.toUpperCase()} Alert`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.title}*\n${alert.description}`,
          },
          accessory: {
            type: 'image',
            image_url: this.getSeverityIcon(alert.severity),
            alt_text: alert.severity,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Severity*\n${alert.severity}`,
            },
            {
              type: 'mrkdwn',
              text: `*Threat Level*\n${threatLevel}`,
            },
            {
              type: 'mrkdwn',
              text: `*Hostility Score*\n${(hostilityScore * 100).toFixed(1)}%`,
            },
            {
              type: 'mrkdwn',
              text: `*Entity ID*\n${alert.entityId}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Details',
                emoji: true,
              },
              value: alertId,
              action_id: `view_alert_${alertId}`,
              style: 'primary',
              url: `${process.env.DASHBOARD_URL}/ops/alerts/${alertId}`,
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Resolve',
                emoji: true,
              },
              value: alertId,
              action_id: `resolve_alert_${alertId}`,
              style: 'danger',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Snooze 1h',
                emoji: true,
              },
              value: alertId,
              action_id: `snooze_alert_${alertId}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Alert ID: \`${alertId}\` | <t:${Math.floor((alert.timestamp ?? Date.now()) / 1000)}:F>`,
            },
          ],
        },
      ],
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

  private getSeverityIcon(severity: string): string {
    // Using emoji-as-image approach (simple colored square)
    switch (severity) {
      case 'critical':
        return 'https://via.placeholder.com/100/FF0000/FF0000';
      case 'high':
        return 'https://via.placeholder.com/100/FF9900/FF9900';
      case 'medium':
        return 'https://via.placeholder.com/100/FFFF00/FFFF00';
      case 'low':
        return 'https://via.placeholder.com/100/00FF00/00FF00';
      default:
        return 'https://via.placeholder.com/100/808080/808080';
    }
  }

  /**
   * Verify webhook URL is valid.
   */
  async verify(): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test message from Grond-Eye',
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
