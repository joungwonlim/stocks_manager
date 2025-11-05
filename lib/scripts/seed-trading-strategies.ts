/**
 * 투자 전략 시드 스크립트
 *
 * trading-strategies-config.ts의 데이터를 데이터베이스에 삽입합니다.
 */

import dotenv from 'dotenv';
import path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { db } from '@/lib/db';
import { tradingStrategies } from '@/lib/db/schema';
import { TRADING_STRATEGIES } from '@/lib/data/trading-strategies-config';
import { eq } from 'drizzle-orm';

async function seedTradingStrategies() {
  console.log('🌱 Seeding trading strategies...');

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const strategyConfig of TRADING_STRATEGIES) {
    try {
      // 기존 전략 확인 (코드로)
      const existing = await db.query.tradingStrategies.findFirst({
        where: eq(tradingStrategies.code, strategyConfig.code),
      });

      if (existing) {
        // 기존 전략 업데이트
        await db
          .update(tradingStrategies)
          .set({
            nameKo: strategyConfig.nameKo,
            nameEn: strategyConfig.nameEn,
            category: strategyConfig.category,
            description: strategyConfig.description,
            keyIndicators: strategyConfig.keyIndicators,
            riskLevel: strategyConfig.riskLevel,
            timeHorizon: strategyConfig.timeHorizon,
            suitableFor: strategyConfig.suitableFor,
            isActive: strategyConfig.isActive,
            priority: strategyConfig.priority,
            updatedAt: new Date(),
          })
          .where(eq(tradingStrategies.id, existing.id));

        updatedCount++;
        console.log(`✏️  Updated: ${strategyConfig.nameKo} (${strategyConfig.code})`);
      } else {
        // 새 전략 추가
        await db.insert(tradingStrategies).values({
          code: strategyConfig.code,
          nameKo: strategyConfig.nameKo,
          nameEn: strategyConfig.nameEn,
          category: strategyConfig.category,
          description: strategyConfig.description,
          keyIndicators: strategyConfig.keyIndicators,
          riskLevel: strategyConfig.riskLevel,
          timeHorizon: strategyConfig.timeHorizon,
          suitableFor: strategyConfig.suitableFor,
          isActive: strategyConfig.isActive,
          priority: strategyConfig.priority,
        });

        addedCount++;
        console.log(`✅ Added: ${strategyConfig.nameKo} (${strategyConfig.code})`);
      }
    } catch (error: any) {
      console.error(`❌ Error processing ${strategyConfig.nameKo}:`, error.message);
      skippedCount++;
    }
  }

  console.log('\n📊 Seeding complete:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  ✏️  Updated: ${updatedCount}`);
  console.log(`  ⚠️  Skipped: ${skippedCount}`);
  console.log(`  📝 Total: ${TRADING_STRATEGIES.length}`);

  // 전략 목록 출력
  console.log('\n📋 Registered strategies by category:');

  const categories = ['fundamental', 'technical', 'portfolio', 'derivatives'] as const;
  for (const category of categories) {
    const categoryStrategies = TRADING_STRATEGIES.filter(s => s.category === category);
    console.log(`\n  [${category.toUpperCase()}]`);
    categoryStrategies.forEach(s => {
      console.log(`    - ${s.nameKo} (${s.nameEn})`);
      console.log(`      Risk: ${s.riskLevel} | Time: ${s.timeHorizon} | Priority: ${s.priority}`);
    });
  }
}

// 스크립트 실행
seedTradingStrategies()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
