/**
 * @file AlertChannelEmail.ts
 * @description Email integration for alert routing via SMTP.
 */

export interface EmailAlert {
  severity: string;
  title: string;
  description: string;
  entityId: string;
  enrichedContext: Record<string, any>;
  timestamp?: number;
}

/**
 * Email channel for alert delivery.
 */
export class AlertChannelEmail {
  private smtpHost: string;
  private smtpPort: number;
  private from: string;
  private recipients: string[];
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 5000]; // ms

  constructor(config: {
    smtpHost: string;
    smtpPort: number;
    from: string;
    recipients: string[];
  }) {
    this.smtpHost = config.smtpHost;
    this.smtpPort = config.smtpPort;
    this.from = config.from;
    this.recipients = config.recipients;
  }

  /**
   * Send alert via email.
   */
  async send(alertId: string, alert: EmailAlert): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailContent = this.formatEmail(alertId, alert);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // In production, use nodemailer or similar library
        // This is a placeholder that would integrate with actual SMTP
        const result = await this.sendViaSmtp(emailContent);

        if (result.success) {
          return {
            success: true,
            messageId: result.messageId,
          };
        }

        // Retry on transient errors
        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelays[attempt]));
          continue;
        }

        return {
          success: false,
          error: result.error,
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

  private formatEmail(alertId: string, alert: EmailAlert): {
    to: string[];
    from: string;
    subject: string;
    html: string;
    text: string;
  } {
    const severity = alert.severity.toUpperCase();
    const threatLevel = alert.enrichedContext.threatLevel ?? 'unknown';
    const hostilityScore = alert.enrichedContext.hostilityScore ?? 0;
    const timestamp = new Date(alert.timestamp ?? Date.now()).toLocaleString();
    const dashboardUrl = process.env.DASHBOARD_URL ? `${process.env.DASHBOARD_URL}/ops/alerts/${alertId}` : null;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 4px; }
    .header h1 { margin: 0; }
    .details { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .field { margin: 10px 0; }
    .field-label { font-weight: bold; color: #666; }
    .field-value { color: #333; margin-left: 10px; }
    .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 ${severity} Alert: ${alert.title}</h1>
    </div>

    <div class="details">
      <h2>Alert Details</h2>
      <div class="field">
        <span class="field-label">Description:</span>
        <span class="field-value">${alert.description}</span>
      </div>

      <div class="field">
        <span class="field-label">Entity ID:</span>
        <span class="field-value">${alert.entityId}</span>
      </div>

      <div class="field">
        <span class="field-label">Threat Level:</span>
        <span class="field-value">${threatLevel}</span>
      </div>

      <div class="field">
        <span class="field-label">Hostility Score:</span>
        <span class="field-value">${(hostilityScore * 100).toFixed(1)}%</span>
      </div>

      <div class="field">
        <span class="field-label">Detected:</span>
        <span class="field-value">${timestamp}</span>
      </div>

      <div class="field">
        <span class="field-label">Alert ID:</span>
        <span class="field-value"><code>${alertId}</code></span>
      </div>
    </div>

    ${alert.enrichedContext.indicators ? `
    <div class="details">
      <h2>Indicators</h2>
      <ul>
        ${(alert.enrichedContext.indicators as string[]).map((indicator) => `<li>${indicator}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${dashboardUrl ? `<a href="${dashboardUrl}" class="button">View in Dashboard</a>` : ''}

    <div class="footer">
      <p>This is an automated alert from Grond-Eye threat detection system.</p>
      <p>Please do not reply to this email. Use the dashboard to manage alerts.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
${severity} ALERT: ${alert.title}

${alert.description}

Entity ID: ${alert.entityId}
Threat Level: ${threatLevel}
Hostility Score: ${(hostilityScore * 100).toFixed(1)}%
Detected: ${timestamp}
Alert ID: ${alertId}

${
  alert.enrichedContext.indicators
    ? `\nIndicators:\n${(alert.enrichedContext.indicators as string[]).map((i) => `- ${i}`).join('\n')}`
    : ''
}

${dashboardUrl ? `\nView in Dashboard: ${dashboardUrl}` : ''}

---
This is an automated alert from Grond-Eye threat detection system.
Please do not reply to this email. Use the dashboard to manage alerts.
    `;

    return {
      to: this.recipients,
      from: this.from,
      subject: `[${severity}] ${alert.title}`,
      html: htmlContent,
      text: textContent,
    };
  }

  private async sendViaSmtp(email: {
    to: string[];
    from: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Placeholder for actual SMTP integration
    // In production, use nodemailer:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({...});
    // const info = await transporter.sendMail(email);
    // return { success: true, messageId: info.messageId };

    console.warn('Email integration requires SMTP configuration. Placeholder sending email to:', email.to.join(', '));

    // For now, return success (actual implementation would send via SMTP)
    return {
      success: true,
      messageId: `email-${Date.now()}`,
    };
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  }

  /**
   * Verify email configuration.
   */
  async verify(): Promise<boolean> {
    // Placeholder: in production, test SMTP connection
    return this.recipients.length > 0;
  }

  /**
   * Update recipients.
   */
  setRecipients(recipients: string[]): void {
    this.recipients = recipients;
  }

  /**
   * Get current recipients.
   */
  getRecipients(): string[] {
    return this.recipients;
  }
}
