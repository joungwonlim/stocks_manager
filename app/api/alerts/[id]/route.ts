import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/alerts/[id]
 * 특정 알림 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alertId = parseInt(id);

    const alert = await db.query.alerts.findFirst({
      where: eq(alerts.id, alertId),
      with: {
        stock: true,
        tradingSignal: true,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error: any) {
    console.error(`Error in GET /api/alerts/[id]:`, error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts/[id]
 * 알림 업데이트 (주로 읽음 상태 변경)
 *
 * Body:
 * {
 *   isRead?: boolean
 *   priority?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alertId = parseInt(id);
    const body = await request.json();

    // 알림 존재 확인
    const existingAlert = await db.query.alerts.findFirst({
      where: eq(alerts.id, alertId),
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // 업데이트할 필드 준비
    const updateData: any = {};

    if (typeof body.isRead === 'boolean') {
      updateData.isRead = body.isRead;
      if (body.isRead) {
        updateData.readAt = new Date();
      }
    }

    if (body.priority) {
      updateData.priority = body.priority;
    }

    // 업데이트 실행
    const [updatedAlert] = await db
      .update(alerts)
      .set(updateData)
      .where(eq(alerts.id, alertId))
      .returning();

    console.log(`✅ Updated alert ${alertId}`);

    return NextResponse.json({
      alert: updatedAlert,
      message: 'Alert updated successfully',
    });
  } catch (error: any) {
    console.error(`Error in PATCH /api/alerts/[id]:`, error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts/[id]
 * 알림 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alertId = parseInt(id);

    // 알림 존재 확인
    const existingAlert = await db.query.alerts.findFirst({
      where: eq(alerts.id, alertId),
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // 삭제 실행
    await db.delete(alerts).where(eq(alerts.id, alertId));

    console.log(`✅ Deleted alert ${alertId}`);

    return NextResponse.json({
      message: 'Alert deleted successfully',
      deletedId: alertId,
    });
  } catch (error: any) {
    console.error(`Error in DELETE /api/alerts/[id]:`, error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
