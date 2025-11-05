import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts, users, stocks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/alerts
 * 알림 목록 조회
 *
 * Query params:
 * - userId: 사용자 ID (optional, default: 1)
 * - isRead: 읽음 여부 (optional, true/false)
 * - limit: 반환할 알림 개수 (optional, default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get('userId') || '1');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 1. 사용자 확인 (없으면 생성)
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      // 기본 사용자 생성
      const [newUser] = await db
        .insert(users)
        .values({
          email: 'default@example.com',
          name: 'Default User',
        })
        .returning();
      user = newUser;
    }

    // 2. 알림 조회 (읽음 여부 필터링)
    let conditions: any[] = [eq(alerts.userId, user.id)];

    if (isRead === 'true') {
      conditions.push(eq(alerts.isRead, true));
    } else if (isRead === 'false') {
      conditions.push(eq(alerts.isRead, false));
    }

    const alertsList = await db.query.alerts.findMany({
      where: conditions.length > 1 ? and(...conditions) : conditions[0],
      with: {
        stock: true,
        tradingSignal: true,
      },
      orderBy: [desc(alerts.createdAt)],
      limit: limit,
    });

    // 3. 통계 정보
    const unreadCount = alertsList.filter(a => !a.isRead).length;
    const highPriorityCount = alertsList.filter(a => a.priority === 'high' && !a.isRead).length;

    return NextResponse.json({
      alerts: alertsList,
      stats: {
        total: alertsList.length,
        unread: unreadCount,
        highPriority: highPriorityCount,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/alerts:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * 알림 생성
 *
 * Body:
 * {
 *   userId?: number (default: 1)
 *   stockId: number
 *   tradingSignalId?: number
 *   alertType: string (e.g., "price_target", "stop_loss", "entry_price")
 *   title: string
 *   message: string
 *   priority?: string (default: "normal")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = 1,
      stockId,
      tradingSignalId,
      alertType,
      title,
      message,
      priority = 'normal',
    } = body;

    // 1. 필수 파라미터 검증
    if (!stockId) {
      return NextResponse.json(
        { error: 'stockId is required' },
        { status: 400 }
      );
    }

    if (!alertType) {
      return NextResponse.json(
        { error: 'alertType is required' },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title and message are required' },
        { status: 400 }
      );
    }

    // 2. 사용자 확인 (없으면 생성)
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: 'default@example.com',
          name: 'Default User',
        })
        .returning();
      user = newUser;
    }

    // 3. 주식 정보 확인
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.id, stockId),
    });

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // 4. 알림 생성
    const [alert] = await db
      .insert(alerts)
      .values({
        userId: user.id,
        stockId,
        tradingSignalId: tradingSignalId || null,
        alertType,
        title,
        message,
        priority,
        isRead: false,
      })
      .returning();

    console.log(`✅ Created alert for ${stock.symbol} (${alertType})`);

    return NextResponse.json({
      alert: {
        ...alert,
        stock,
      },
      message: 'Alert created successfully',
    });
  } catch (error: any) {
    console.error('Error in POST /api/alerts:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
