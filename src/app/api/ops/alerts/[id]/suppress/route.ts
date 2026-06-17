import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOpsUserId, getTenantId } from '@/lib/ops/session';

/**
 * PATCH /api/ops/alerts/[id]/suppress — suppress an alert temporarily.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await getOpsUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId();
  const alertId = params.id;

  try {
    const body = await request.json().catch(() => ({}));
    const durationMs = typeof body.durationMs === 'number' ? body.durationMs : 3600000; // 1 hour default

    const suppressedUntil = new Date(Date.now() + durationMs);

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'suppressed',
        suppressedUntil,
      },
    });

    // Record event
    await prisma.alertEvent.create({
      data: {
        tenantId,
        alertId,
        eventType: 'suppressed',
        actorUserId: userId,
        actorAction: 'suppressed',
        eventData: JSON.stringify({ durationMs, suppressedUntil }),
      },
    });

    // Schedule re-activation
    setTimeout(async () => {
      try {
        const current = await prisma.alert.findUnique({ where: { id: alertId } });
        if (current && current.status === 'suppressed') {
          await prisma.alert.update({
            where: { id: alertId },
            data: { status: 'active' },
          });
        }
      } catch (error) {
        console.error(`Failed to reactivate alert ${alertId}:`, error);
      }
    }, durationMs);

    return NextResponse.json({
      id: alert.id,
      status: alert.status,
      suppressedUntil: suppressedUntil.getTime(),
    });
  } catch (e) {
    console.error(`PATCH /api/ops/alerts/${alertId}/suppress`, e);
    return NextResponse.json({ error: 'Failed to suppress alert' }, { status: 500 });
  }
}
