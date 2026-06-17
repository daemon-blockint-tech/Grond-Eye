/**
 * @file AlertChannelPagerDuty.ts
 * @description PagerDuty Events API v2 integration for alert routing.
 */

export interface PagerDutyAlert {
  severity: string;
  title: string;
  description: string;
  entityId: string;
  enrichedContext: Record<string, any>;
  timestamp?: number;
}

/**
 * PagerDuty integration for critical alerts.
 */
export class AlertChannelPagerDuty {
  private apiKey: string;
  private routingKey: string;
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 5000]; // ms
  private baseUrl = 'https://events.pagerduty.com/v2/enqueue';

  constructor(apiKey: string, routingKey: string) {
    this.apiKey = apiKey;
    this.routingKey = routingKey;
  }

  /**
   * Send alert to PagerDuty as an incident.
   */
  async send(alertId: string, alert: PagerDutyAlert): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const payload = this.formatEvent(alertId, alert);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token token=${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          return {
            success: true,
            messageId: data.id,
          };
        }

        // Retry on 429 (rate limit) or 5xx errors
        if (response.status === 429 || response.status >= 500) {
          if (attempt < this.maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, this.retryDelays[attempt]));
            continue;
          }
        }

        // Parse error details
        const errorData = (await response.json().catch(() => ({}))) as any;
        const errorMessage = errorData?.error?.message || response.statusText;

        return {
          success: false,
          error: `PagerDuty API error: ${errorMessage}`,
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

  private formatEvent(alertId: string, alert: PagerDutyAlert): Record<string, any> {
    const severity = this.mapToEventLogSeverity(alert.severity);
    const threatLevel = alert.enrichedContext.threatLevel ?? 'unknown';
    const hostilityScore = alert.enrichedContext.hostilityScore ?? 0;

    return {
      routing_key: this.routingKey,
      event_action: 'trigger',
      dedup_key: alertId,
      payload: {
        summary: alert.title,
        severity,
        source: alert.entityId,
        timestamp: new Date(alert.timestamp ?? Date.now()).toISOString(),
        custom_details: {
          description: alert.description,
          alert_id: alertId,
          threat_level: threatLevel,
          hostility_score: (hostilityScore * 100).toFixed(1) + '%',
          indicators: alert.enrichedContext.indicators ?? [],
          related_entities: alert.enrichedContext.relatedEntities ?? [],
          dashboard_url: process.env.DASHBOARD_URL ? `${process.env.DASHBOARD_URL}/ops/alerts/${alertId}` : undefined,
        },
      },
      client: 'Grond-Eye',
      client_url: process.env.DASHBOARD_URL,
    };
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
   * Acknowledge an incident (manual remediation).
   */
  async acknowledge(incidentId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://api.pagerduty.com/incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token token=${this.apiKey}`,
          Accept: 'application/vnd.pagerduty+json;version=2',
        },
        body: JSON.stringify({
          incidents: [
            {
              id: incidentId,
              type: 'incident_reference',
              status: 'acknowledged',
            },
          ],
          extra: {
            from: userId,
          },
        }),
      });

      if (response.ok) {
        return { success: true };
      }

      return {
        success: false,
        error: `Failed to acknowledge: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Resolve an incident.
   */
  async resolve(incidentId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://api.pagerduty.com/incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token token=${this.apiKey}`,
          Accept: 'application/vnd.pagerduty+json;version=2',
        },
        body: JSON.stringify({
          incidents: [
            {
              id: incidentId,
              type: 'incident_reference',
              status: 'resolved',
            },
          ],
          extra: {
            from: userId,
          },
        }),
      });

      if (response.ok) {
        return { success: true };
      }

      return {
        success: false,
        error: `Failed to resolve: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify API credentials.
   */
  async verify(): Promise<boolean> {
    try {
      const response = await fetch('https://api.pagerduty.com/users/me', {
        headers: {
          Authorization: `Token token=${this.apiKey}`,
          Accept: 'application/vnd.pagerduty+json;version=2',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
