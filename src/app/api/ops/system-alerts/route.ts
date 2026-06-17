import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOpsUserId, getTenantId } from '@/lib/ops/session';

/**
 * GET /api/ops/system-alerts — list system alerts (anomalies, threats, fusions).
 * Supports filtering by status, severity, entity, time range.
 */
export async function GET(request: Request) {
  const userId = await getOpsUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId();

  try {
    const url = new URL(request.url);

    // Parse query parameters
    const status = url.searchParams.get('status') ?? 'active';
    const severity = url.searchParams.get('severity');
    const type = url.searchParams.get('type'); // 'threat', 'anomaly', 'fusion', 'threshold'
    const entityId = url.searchParams.get('entityId');
    const sourcePluginId = url.searchParams.get('sourcePluginId');

    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') ?? '0');

    // Parse time range
    const startTime = url.searchParams.get('startTime');
    const endTime = url.searchParams.get('endTime');

    // Build where clause
    const where: any = {
      tenantId,
    };

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Severity filter
    if (severity) {
      where.severity = severity;
    }

    // Type filter
    if (type) {
      where.type = type;
    }

    // Entity filter
    if (entityId) {
      where.entityId = entityId;
    }

    // Source plugin filter
    if (sourcePluginId) {
      where.sourcePluginId = sourcePluginId;
    }

    // Time range filter
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt.gte = new Date(parseInt(startTime));
      }
      if (endTime) {
        where.createdAt.lte = new Date(parseInt(endTime));
      }
    }

    // Execute query
    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { lastSeen: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.alert.count({ where }),
    ]);

    // Transform response
    const transformedAlerts = alerts.map((a) => ({
      id: a.id,
      sourceAlertIds: JSON.parse(a.sourceAlertIds),
      aggregatedCount: a.aggregatedCount,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
      entityId: a.entityId,
      sourcePluginId: a.sourcePluginId,
      enrichedContext: JSON.parse(a.enrichedContext),
      status: a.status,
      escalationLevel: a.escalationLevel,
      routes: JSON.parse(a.routes),
      createdAt: a.createdAt.getTime(),
      lastSeen: a.lastSeen.getTime(),
      resolvedAt: a.resolvedAt?.getTime() ?? null,
      suppressedUntil: a.suppressedUntil?.getTime() ?? null,
    }));

    return NextResponse.json({
      alerts: transformedAlerts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (e) {
    console.error('GET /api/ops/system-alerts', e);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
