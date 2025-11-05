import { NextRequest, NextResponse } from 'next/server';
import { monitorAllStockAlerts, monitorStockAlerts } from '@/lib/services/alert-monitoring-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/alerts/monitor
 * 알림 모니터링 실행
 *
 * Body (optional):
 * {
 *   stockIds?: number[]  // 특정 종목들만 모니터링
 *   userId?: number      // 사용자 ID (default: 1)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { stockIds, userId = 1 } = body;

    console.log(`🔍 Starting alert monitoring...`);

    if (stockIds && Array.isArray(stockIds) && stockIds.length === 1) {
      // 단일 종목 모니터링
      const result = await monitorStockAlerts(stockIds[0], userId);

      return NextResponse.json({
        message: 'Single stock monitoring completed',
        result: {
          alertsCreated: result.created,
          conditionsChecked: result.checked,
          stockId: stockIds[0],
        },
      });
    } else {
      // 여러 종목 또는 전체 모니터링
      const result = await monitorAllStockAlerts(stockIds, userId);

      return NextResponse.json({
        message: 'Alert monitoring completed',
        result: {
          totalCreated: result.totalCreated,
          totalChecked: result.totalChecked,
          stocksMonitored: result.stocksMonitored,
        },
      });
    }
  } catch (error: any) {
    console.error('Error in POST /api/alerts/monitor:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
