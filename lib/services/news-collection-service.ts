/**
 * 뉴스 수집 서비스
 *
 * RSS 피드를 통해 뉴스를 수집하고 데이터베이스에 저장합니다.
 */

import Parser from 'rss-parser';
import { db } from '@/lib/db';
import { newsSources, newsArticles, newsCollectionLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// RSS Parser 초기화
const parser = new Parser({
  customFields: {
    item: [
      ['dc:creator', 'creator'],
      ['media:content', 'mediaContent'],
      ['description', 'description'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

/**
 * 콘텐츠 해시 생성 (중복 체크용)
 */
function generateContentHash(title: string, url: string): string {
  const content = `${title}|${url}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * HTML 태그 제거 및 텍스트 정리
 */
function cleanHtmlText(html: string | undefined): string {
  if (!html) return '';

  // HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, '');

  // HTML 엔티티 디코딩
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // 여러 공백을 하나로
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * 기사 내용에서 종목 추출 (간단한 버전)
 * TODO: 향후 AI 기반으로 고도화
 */
function extractMentionedStocks(title: string, content: string): Array<{ symbol: string; relevance: number }> {
  const mentionedStocks: Array<{ symbol: string; relevance: number }> = [];

  // 주요 종목 키워드 매핑
  const stockKeywords: Record<string, string> = {
    '삼성전자': '005930.KS',
    'SK하이닉스': '000660.KS',
    '하이닉스': '000660.KS',
    'NAVER': '035420.KS',
    '네이버': '035420.KS',
    '카카오': '035720.KS',
    'LG에너지솔루션': '373220.KS',
    '현대차': '005380.KS',
    '기아': '000270.KS',
    'POSCO': '005490.KS',
    '포스코': '005490.KS',
    '애플': 'AAPL',
    'Apple': 'AAPL',
    '테슬라': 'TSLA',
    'Tesla': 'TSLA',
    '엔비디아': 'NVDA',
    'NVIDIA': 'NVDA',
    '마이크로소프트': 'MSFT',
    'Microsoft': 'MSFT',
    '아마존': 'AMZN',
    'Amazon': 'AMZN',
  };

  const text = `${title} ${content}`.toLowerCase();

  for (const [keyword, symbol] of Object.entries(stockKeywords)) {
    if (text.includes(keyword.toLowerCase())) {
      // 제목에 있으면 관련성 높게, 본문에만 있으면 중간
      const inTitle = title.toLowerCase().includes(keyword.toLowerCase());
      const relevance = inTitle ? 90 : 60;

      mentionedStocks.push({ symbol, relevance });
    }
  }

  // 중복 제거 및 relevance 기준 정렬
  const uniqueStocks = Array.from(
    new Map(mentionedStocks.map(item => [item.symbol, item])).values()
  ).sort((a, b) => b.relevance - a.relevance);

  return uniqueStocks;
}

/**
 * 단일 RSS 피드 수집
 */
export async function collectRssFeed(
  sourceId: number,
  sourceName: string,
  rssUrl: string
): Promise<{
  success: boolean;
  articlesCollected: number;
  articlesNew: number;
  articlesDuplicate: number;
  error?: string;
}> {
  const startTime = Date.now();
  let articlesCollected = 0;
  let articlesNew = 0;
  let articlesDuplicate = 0;

  try {
    console.log(`📰 [${sourceName}] Starting RSS collection from: ${rssUrl}`);

    // RSS 피드 파싱
    const feed = await parser.parseURL(rssUrl);

    if (!feed.items || feed.items.length === 0) {
      console.log(`⚠️  [${sourceName}] No items found in RSS feed`);
      return {
        success: true,
        articlesCollected: 0,
        articlesNew: 0,
        articlesDuplicate: 0,
      };
    }

    console.log(`📄 [${sourceName}] Found ${feed.items.length} items in feed`);

    // 각 기사 처리
    for (const item of feed.items) {
      if (!item.title || !item.link) {
        console.log(`⚠️  [${sourceName}] Skipping item without title or link`);
        continue;
      }

      articlesCollected++;

      // 콘텐츠 해시 생성 (중복 체크용)
      const contentHash = generateContentHash(item.title, item.link);

      // 중복 체크
      const existingArticle = await db.query.newsArticles.findFirst({
        where: eq(newsArticles.contentHash, contentHash),
      });

      if (existingArticle) {
        articlesDuplicate++;
        continue;
      }

      // 내용 추출 및 정리
      const content =
        cleanHtmlText(item.contentEncoded) ||
        cleanHtmlText(item['content:encoded'] as string) ||
        cleanHtmlText(item.content) ||
        cleanHtmlText(item.description) ||
        '';

      // 종목 추출
      const mentionedStocks = extractMentionedStocks(item.title, content);

      // 발행일 파싱
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      // DB에 저장
      await db.insert(newsArticles).values({
        sourceId,
        title: item.title.substring(0, 500), // 길이 제한
        content: content.substring(0, 50000), // 50KB 제한
        url: item.link.substring(0, 1000),
        author: item.creator || null,
        publishedAt,
        category: item.categories?.[0] || null,
        tags: item.categories || null,
        mentionedStocks: mentionedStocks.length > 0 ? mentionedStocks : null,
        contentHash,
        sentiment: null, // AI 분석 필요
        sentimentScore: null,
        importance: mentionedStocks.length > 0 ? 5 : 3, // 종목 언급 있으면 중요도 높게
      });

      articlesNew++;
      console.log(`✅ [${sourceName}] Saved: ${item.title.substring(0, 60)}...`);
    }

    const duration = Date.now() - startTime;
    console.log(
      `✨ [${sourceName}] Completed: ${articlesNew} new, ${articlesDuplicate} duplicates (${duration}ms)`
    );

    // 수집 로그 저장
    await db.insert(newsCollectionLogs).values({
      sourceId,
      status: 'success',
      articlesCollected,
      articlesNew,
      articlesDuplicate,
      duration,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    });

    // 소스의 lastCollectedAt 업데이트
    await db
      .update(newsSources)
      .set({ lastCollectedAt: new Date() })
      .where(eq(newsSources.id, sourceId));

    return {
      success: true,
      articlesCollected,
      articlesNew,
      articlesDuplicate,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${sourceName}] Error collecting RSS:`, error);

    // 에러 로그 저장
    await db.insert(newsCollectionLogs).values({
      sourceId,
      status: 'failed',
      articlesCollected,
      articlesNew,
      articlesDuplicate,
      errorMessage: error?.message || 'Unknown error',
      duration,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    });

    return {
      success: false,
      articlesCollected,
      articlesNew,
      articlesDuplicate,
      error: error?.message,
    };
  }
}

/**
 * 활성화된 모든 RSS 소스에서 뉴스 수집
 */
export async function collectAllRssFeeds(): Promise<{
  totalSources: number;
  successCount: number;
  failedCount: number;
  totalArticlesNew: number;
  results: Array<{
    sourceName: string;
    success: boolean;
    articlesNew: number;
    error?: string;
  }>;
}> {
  console.log('🚀 Starting collection from all active RSS sources...');

  // 활성화된 RSS 소스 조회
  const rssSources = await db.query.newsSources.findMany({
    where: (sources, { eq, and }) =>
      and(eq(sources.isActive, true), eq(sources.collectionMethod, 'rss')),
  });

  if (rssSources.length === 0) {
    console.log('⚠️  No active RSS sources found');
    return {
      totalSources: 0,
      successCount: 0,
      failedCount: 0,
      totalArticlesNew: 0,
      results: [],
    };
  }

  console.log(`📡 Found ${rssSources.length} active RSS sources`);

  const results = [];
  let successCount = 0;
  let failedCount = 0;
  let totalArticlesNew = 0;

  // 각 소스에서 수집 (순차 처리 - Rate limiting 고려)
  for (const source of rssSources) {
    if (!source.rssUrl) {
      console.log(`⚠️  [${source.name}] No RSS URL configured, skipping`);
      continue;
    }

    const result = await collectRssFeed(source.id, source.name, source.rssUrl);

    results.push({
      sourceName: source.name,
      success: result.success,
      articlesNew: result.articlesNew,
      error: result.error,
    });

    if (result.success) {
      successCount++;
      totalArticlesNew += result.articlesNew;
    } else {
      failedCount++;
    }

    // Rate limiting: 각 요청 사이에 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(
    `🎉 Collection completed: ${successCount}/${rssSources.length} sources succeeded, ${totalArticlesNew} new articles`
  );

  return {
    totalSources: rssSources.length,
    successCount,
    failedCount,
    totalArticlesNew,
    results,
  };
}

/**
 * 특정 카테고리의 뉴스만 수집
 */
export async function collectNewsByCategory(
  category: 'disclosure' | 'news' | 'report' | 'research' | 'technical' | 'official'
): Promise<any> {
  console.log(`🎯 Starting collection for category: ${category}`);

  const sources = await db.query.newsSources.findMany({
    where: (sources, { eq, and }) =>
      and(
        eq(sources.isActive, true),
        eq(sources.collectionMethod, 'rss'),
        eq(sources.category, category)
      ),
  });

  console.log(`📡 Found ${sources.length} sources for category ${category}`);

  const results = [];
  for (const source of sources) {
    if (!source.rssUrl) continue;

    const result = await collectRssFeed(source.id, source.name, source.rssUrl);
    results.push({
      sourceName: source.name,
      ...result,
    });

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
