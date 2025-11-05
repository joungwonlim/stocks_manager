import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newsArticles, newsSources } from '@/lib/db/schema';
import { desc, and, eq, gte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/news/latest
 * 최신 뉴스 조회
 *
 * Query params:
 * - limit: 반환할 기사 수 (기본값: 20)
 * - hours: 최근 N시간 이내 기사만 (기본값: 24)
 * - category: 카테고리 필터 (news, disclosure, official, report)
 * - symbol: 특정 종목 관련 뉴스만
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const hours = parseInt(searchParams.get('hours') || '24');
    const category = searchParams.get('category');
    const symbol = searchParams.get('symbol');

    // 시간 필터 (최근 N시간)
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    // 쿼리 조건 생성
    const conditions = [gte(newsArticles.publishedAt, timeThreshold)];

    // 종목 필터
    if (symbol) {
      // mentionedStocks JSON에 symbol이 포함된 기사
      conditions.push(
        sql`${newsArticles.mentionedStocks}::text LIKE ${`%${symbol}%`}`
      );
    }

    // 카테고리 필터는 JOIN을 통해 처리
    let articles;

    if (category) {
      // 카테고리 필터가 있으면 JOIN
      articles = await db
        .select({
          id: newsArticles.id,
          title: newsArticles.title,
          summary: newsArticles.summary,
          url: newsArticles.url,
          author: newsArticles.author,
          publishedAt: newsArticles.publishedAt,
          category: newsArticles.category,
          tags: newsArticles.tags,
          sentiment: newsArticles.sentiment,
          sentimentScore: newsArticles.sentimentScore,
          importance: newsArticles.importance,
          mentionedStocks: newsArticles.mentionedStocks,
          sourceName: newsSources.name,
          sourceCategory: newsSources.category,
        })
        .from(newsArticles)
        .innerJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
        .where(and(eq(newsSources.category, category), ...conditions))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(limit);
    } else {
      // 카테고리 필터 없으면 단순 조회
      articles = await db
        .select({
          id: newsArticles.id,
          title: newsArticles.title,
          summary: newsArticles.summary,
          url: newsArticles.url,
          author: newsArticles.author,
          publishedAt: newsArticles.publishedAt,
          category: newsArticles.category,
          tags: newsArticles.tags,
          sentiment: newsArticles.sentiment,
          sentimentScore: newsArticles.sentimentScore,
          importance: newsArticles.importance,
          mentionedStocks: newsArticles.mentionedStocks,
          sourceName: newsSources.name,
          sourceCategory: newsSources.category,
        })
        .from(newsArticles)
        .innerJoin(newsSources, eq(newsArticles.sourceId, newsSources.id))
        .where(and(...conditions))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(limit);
    }

    return NextResponse.json({
      count: articles.length,
      hours,
      category: category || 'all',
      symbol: symbol || null,
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        url: article.url,
        author: article.author,
        publishedAt: article.publishedAt,
        category: article.category,
        tags: article.tags,
        sentiment: article.sentiment,
        sentimentScore: article.sentimentScore
          ? parseFloat(article.sentimentScore)
          : null,
        importance: article.importance,
        mentionedStocks: article.mentionedStocks,
        source: {
          name: article.sourceName,
          category: article.sourceCategory,
        },
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/news/latest:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
