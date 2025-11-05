/**
 * 뉴스 소스 시드 스크립트
 *
 * news-sources-config.ts의 데이터를 데이터베이스에 삽입합니다.
 */

import { db } from '@/lib/db';
import { newsSources } from '@/lib/db/schema';
import { NEWS_SOURCES } from '@/lib/data/news-sources-config';
import { eq } from 'drizzle-orm';

async function seedNewsSources() {
  console.log('🌱 Seeding news sources...');

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const sourceConfig of NEWS_SOURCES) {
    try {
      // 기존 소스 확인 (이름으로)
      const existing = await db.query.newsSources.findFirst({
        where: eq(newsSources.name, sourceConfig.name),
      });

      if (existing) {
        // 기존 소스 업데이트
        await db
          .update(newsSources)
          .set({
            url: sourceConfig.url,
            category: sourceConfig.category,
            subcategory: sourceConfig.subcategory,
            collectionMethod: sourceConfig.collectionMethod,
            rssUrl: sourceConfig.rssUrl,
            apiEndpoint: sourceConfig.apiEndpoint,
            isActive: sourceConfig.isActive,
            collectionFrequency: sourceConfig.collectionFrequency,
            language: sourceConfig.language,
            country: sourceConfig.country,
            updatedAt: new Date(),
          })
          .where(eq(newsSources.id, existing.id));

        updatedCount++;
        console.log(`✏️  Updated: ${sourceConfig.name}`);
      } else {
        // 새 소스 추가
        await db.insert(newsSources).values({
          name: sourceConfig.name,
          url: sourceConfig.url,
          category: sourceConfig.category,
          subcategory: sourceConfig.subcategory,
          collectionMethod: sourceConfig.collectionMethod,
          rssUrl: sourceConfig.rssUrl,
          apiEndpoint: sourceConfig.apiEndpoint,
          isActive: sourceConfig.isActive,
          collectionFrequency: sourceConfig.collectionFrequency,
          language: sourceConfig.language,
          country: sourceConfig.country,
        });

        addedCount++;
        console.log(`✅ Added: ${sourceConfig.name}`);
      }
    } catch (error: any) {
      console.error(`❌ Error processing ${sourceConfig.name}:`, error.message);
      skippedCount++;
    }
  }

  console.log('\n📊 Seeding complete:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  ✏️  Updated: ${updatedCount}`);
  console.log(`  ⚠️  Skipped: ${skippedCount}`);
  console.log(`  📝 Total: ${NEWS_SOURCES.length}`);
}

// 스크립트 실행
seedNewsSources()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
