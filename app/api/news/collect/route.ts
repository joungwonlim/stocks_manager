import { NextRequest, NextResponse } from 'next/server';
import { collectAllRssFeeds, collectNewsByCategory } from '@/lib/services/news-collection-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5분 (Vercel Pro 필요)

/**
 * POST /api/news/collect
 * RSS 뉴스 수집
 *
 * Body (optional):
 * {
 *   "category": "news" // 특정 카테고리만 수집
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { category } = body;

    console.log('📡 Starting news collection...');
    const startTime = Date.now();

    let result;

    if (category) {
      // 특정 카테고리만 수집
      result = await collectNewsByCategory(category);
    } else {
      // 모든 활성화된 RSS 소스에서 수집
      result = await collectAllRssFeeds();
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'News collection completed',
      duration: `${duration}ms`,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in POST /api/news/collect:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/news/collect
 * 수집 정보 조회 (테스트용)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method to start news collection',
    endpoints: {
      'POST /api/news/collect': 'Collect from all active RSS sources',
      'POST /api/news/collect (with body)': {
        category: 'news | disclosure | official | report',
      },
    },
  });
}
