import { NextRequest, NextResponse } from 'next/server';
import {
  startScheduler,
  stopScheduler,
  runImmediateCollection,
  getWatchlist,
} from '@/lib/services/scheduler-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scheduler
 * 스케줄러 상태 및 관심 종목 조회
 */
export async function GET(request: NextRequest) {
  try {
    const watchlist = getWatchlist();

    return NextResponse.json({
      watchlist,
      count: watchlist.length,
      schedulerEnabled: process.env.ENABLE_SCHEDULER === 'true',
    });
  } catch (error: any) {
    console.error('Error in GET /api/scheduler:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler
 * 스케줄러 제어 및 즉시 수집 실행
 *
 * Body:
 * {
 *   "action": "start" | "stop" | "run",
 *   "timeframe": "1m" | "5m" | "15m" | "1h" // for "run" action
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, timeframe = '5m' } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required (start, stop, or run)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        startScheduler();
        return NextResponse.json({
          success: true,
          message: 'Scheduler started',
        });

      case 'stop':
        stopScheduler();
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped',
        });

      case 'run':
        await runImmediateCollection(timeframe);
        return NextResponse.json({
          success: true,
          message: `Immediate collection completed (${timeframe})`,
          timeframe,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or run' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in POST /api/scheduler:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
