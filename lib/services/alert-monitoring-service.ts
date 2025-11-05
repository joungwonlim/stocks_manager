import { db } from '@/lib/db';
import { alerts, priceTargets, tradingSignals, stocks, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fetchStockQuote } from './stock-price-service';

export interface PriceAlertCondition {
  stockId: number;
  tradingSignalId?: number;
  alertType: 'entry_price' | 'stop_loss' | 'target_price_1' | 'target_price_2' | 'target_price_3';
  targetPrice: number;
  currentPrice: number;
  threshold?: number; // 허용 오차 (기본값: 0.5%)
}

/**
 * 가격 목표 도달 여부 확인
 */
export function isPriceTargetReached(
  currentPrice: number,
  targetPrice: number,
  alertType: string,
  threshold: number = 0.005 // 0.5%
): boolean {
  const difference = Math.abs(currentPrice - targetPrice) / targetPrice;

  // 진입가/목표가: 현재가가 목표가에 도달하거나 초과
  if (alertType.includes('entry') || alertType.includes('target')) {
    return currentPrice >= targetPrice * (1 - threshold);
  }

  // 손절가: 현재가가 손절가 이하로 하락
  if (alertType.includes('stop_loss')) {
    return currentPrice <= targetPrice * (1 + threshold);
  }

  return false;
}

/**
 * 알림 중복 확인 (같은 종목, 같은 타입의 최근 알림이 있는지)
 */
async function isAlertDuplicate(
  userId: number,
  stockId: number,
  alertType: string,
  withinMinutes: number = 60
): Promise<boolean> {
  const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);

  const recentAlerts = await db.query.alerts.findMany({
    where: and(
      eq(alerts.userId, userId),
      eq(alerts.stockId, stockId),
      eq(alerts.alertType, alertType)
    ),
    limit: 5,
  });

  // 최근 1시간 이내 같은 알림이 있는지 확인
  return recentAlerts.some(
    (alert) => new Date(alert.createdAt).getTime() > cutoffTime.getTime()
  );
}

/**
 * 단일 종목의 가격 알림 모니터링
 */
export async function monitorStockAlerts(
  stockId: number,
  userId: number = 1
): Promise<{ created: number; checked: number }> {
  try {
    // 1. 주식 정보 조회
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.id, stockId),
    });

    if (!stock) {
      throw new Error(`Stock not found: ${stockId}`);
    }

    // 2. 현재 가격 조회
    const quote = await fetchStockQuote(stock.symbol);
    if (!quote) {
      console.warn(`⚠️ Could not fetch quote for ${stock.symbol}`);
      return { created: 0, checked: 0 };
    }

    const currentPrice = quote.price;

    // 3. 활성 매매 신호 조회
    const activeSignals = await db.query.tradingSignals.findMany({
      where: and(
        eq(tradingSignals.stockId, stockId),
        eq(tradingSignals.status, 'active')
      ),
      limit: 10,
    });

    let alertsCreated = 0;
    let conditionsChecked = 0;

    // 4. 각 신호에 대해 알림 조건 확인
    for (const signal of activeSignals) {
      const conditions: PriceAlertCondition[] = [];

      // 진입가 알림
      if (signal.entryPrice) {
        conditions.push({
          stockId,
          tradingSignalId: signal.id,
          alertType: 'entry_price',
          targetPrice: parseFloat(signal.entryPrice),
          currentPrice,
        });
      }

      // 손절가 알림
      if (signal.stopLossPrice) {
        conditions.push({
          stockId,
          tradingSignalId: signal.id,
          alertType: 'stop_loss',
          targetPrice: parseFloat(signal.stopLossPrice),
          currentPrice,
        });
      }

      // 목표가 알림
      if (signal.targetPrice1) {
        conditions.push({
          stockId,
          tradingSignalId: signal.id,
          alertType: 'target_price_1',
          targetPrice: parseFloat(signal.targetPrice1),
          currentPrice,
        });
      }

      if (signal.targetPrice2) {
        conditions.push({
          stockId,
          tradingSignalId: signal.id,
          alertType: 'target_price_2',
          targetPrice: parseFloat(signal.targetPrice2),
          currentPrice,
        });
      }

      if (signal.targetPrice3) {
        conditions.push({
          stockId,
          tradingSignalId: signal.id,
          alertType: 'target_price_3',
          targetPrice: parseFloat(signal.targetPrice3),
          currentPrice,
        });
      }

      // 5. 각 조건 확인 및 알림 생성
      for (const condition of conditions) {
        conditionsChecked++;

        const reached = isPriceTargetReached(
          condition.currentPrice,
          condition.targetPrice,
          condition.alertType
        );

        if (reached) {
          // 중복 알림 확인
          const isDuplicate = await isAlertDuplicate(
            userId,
            stockId,
            condition.alertType,
            60
          );

          if (!isDuplicate) {
            // 알림 메시지 생성
            const alertMessages = {
              entry_price: {
                title: `🎯 ${stock.name} 진입가 도달!`,
                message: `${stock.name}(${stock.symbol})이 진입가 ${condition.targetPrice.toLocaleString()}원에 도달했습니다. 현재가: ${currentPrice.toLocaleString()}원`,
              },
              stop_loss: {
                title: `⚠️ ${stock.name} 손절가 도달!`,
                message: `${stock.name}(${stock.symbol})이 손절가 ${condition.targetPrice.toLocaleString()}원에 도달했습니다. 현재가: ${currentPrice.toLocaleString()}원`,
              },
              target_price_1: {
                title: `💰 ${stock.name} 1차 목표가 달성!`,
                message: `${stock.name}(${stock.symbol})이 1차 목표가 ${condition.targetPrice.toLocaleString()}원에 도달했습니다. 현재가: ${currentPrice.toLocaleString()}원`,
              },
              target_price_2: {
                title: `💰 ${stock.name} 2차 목표가 달성!`,
                message: `${stock.name}(${stock.symbol})이 2차 목표가 ${condition.targetPrice.toLocaleString()}원에 도달했습니다. 현재가: ${currentPrice.toLocaleString()}원`,
              },
              target_price_3: {
                title: `🎉 ${stock.name} 최종 목표가 달성!`,
                message: `${stock.name}(${stock.symbol})이 최종 목표가 ${condition.targetPrice.toLocaleString()}원에 도달했습니다. 현재가: ${currentPrice.toLocaleString()}원`,
              },
            };

            const alertData = alertMessages[condition.alertType as keyof typeof alertMessages];
            const priority = condition.alertType === 'stop_loss' ? 'high' : 'normal';

            await db.insert(alerts).values({
              userId,
              stockId,
              tradingSignalId: condition.tradingSignalId || null,
              alertType: condition.alertType,
              title: alertData.title,
              message: alertData.message,
              priority,
              isRead: false,
            });

            alertsCreated++;
            console.log(`✅ Created ${condition.alertType} alert for ${stock.symbol}`);
          }
        }
      }
    }

    return { created: alertsCreated, checked: conditionsChecked };
  } catch (error) {
    console.error(`Error monitoring stock ${stockId}:`, error);
    throw error;
  }
}

/**
 * 여러 종목의 알림 모니터링
 */
export async function monitorAllStockAlerts(
  stockIds?: number[],
  userId: number = 1
): Promise<{ totalCreated: number; totalChecked: number; stocksMonitored: number }> {
  try {
    // stockIds가 없으면 모든 활성 주식 조회
    let targetStockIds = stockIds;

    if (!targetStockIds || targetStockIds.length === 0) {
      const allStocks = await db.query.stocks.findMany({
        where: eq(stocks.isActive, true),
        limit: 100,
      });
      targetStockIds = allStocks.map((s) => s.id);
    }

    let totalCreated = 0;
    let totalChecked = 0;

    // 각 종목 순차 모니터링 (크롤링 예의)
    for (const stockId of targetStockIds) {
      try {
        const result = await monitorStockAlerts(stockId, userId);
        totalCreated += result.created;
        totalChecked += result.checked;

        // 요청 간 딜레이
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to monitor stock ${stockId}:`, error);
      }
    }

    console.log(`✅ Monitoring complete: ${totalCreated} alerts created, ${totalChecked} conditions checked`);

    return {
      totalCreated,
      totalChecked,
      stocksMonitored: targetStockIds.length,
    };
  } catch (error) {
    console.error('Error monitoring all stocks:', error);
    throw error;
  }
}

/**
 * 특정 매매 신호에 대한 가격 목표 생성
 */
export async function createPriceTargetsForSignal(signalId: number): Promise<void> {
  try {
    const signal = await db.query.tradingSignals.findFirst({
      where: eq(tradingSignals.id, signalId),
    });

    if (!signal) {
      throw new Error(`Trading signal not found: ${signalId}`);
    }

    const currentPrice = parseFloat(signal.currentPrice);
    const targets: Array<{
      targetType: string;
      targetPrice: string;
      percentage: string;
    }> = [];

    // 진입가
    if (signal.entryPrice) {
      const entryPrice = parseFloat(signal.entryPrice);
      const percentage = ((entryPrice - currentPrice) / currentPrice * 100).toFixed(2);
      targets.push({
        targetType: 'entry',
        targetPrice: signal.entryPrice,
        percentage,
      });
    }

    // 손절가
    if (signal.stopLossPrice) {
      const stopLoss = parseFloat(signal.stopLossPrice);
      const percentage = ((stopLoss - currentPrice) / currentPrice * 100).toFixed(2);
      targets.push({
        targetType: 'stop_loss',
        targetPrice: signal.stopLossPrice,
        percentage,
      });
    }

    // 목표가들
    if (signal.targetPrice1) {
      const target1 = parseFloat(signal.targetPrice1);
      const percentage = ((target1 - currentPrice) / currentPrice * 100).toFixed(2);
      targets.push({
        targetType: 'target_1',
        targetPrice: signal.targetPrice1,
        percentage,
      });
    }

    if (signal.targetPrice2) {
      const target2 = parseFloat(signal.targetPrice2);
      const percentage = ((target2 - currentPrice) / currentPrice * 100).toFixed(2);
      targets.push({
        targetType: 'target_2',
        targetPrice: signal.targetPrice2,
        percentage,
      });
    }

    if (signal.targetPrice3) {
      const target3 = parseFloat(signal.targetPrice3);
      const percentage = ((target3 - currentPrice) / currentPrice * 100).toFixed(2);
      targets.push({
        targetType: 'target_3',
        targetPrice: signal.targetPrice3,
        percentage,
      });
    }

    // price_targets 테이블에 저장
    for (const target of targets) {
      try {
        await db.insert(priceTargets).values({
          stockId: signal.stockId,
          tradingSignalId: signal.id,
          targetType: target.targetType,
          targetPrice: target.targetPrice,
          currentPrice: signal.currentPrice,
          percentage: target.percentage,
          status: 'pending',
        });
      } catch (error: any) {
        // 중복 키 에러는 무시
        if (!error?.message?.includes('duplicate')) {
          console.error(`Error saving price target:`, error);
        }
      }
    }

    console.log(`✅ Created ${targets.length} price targets for signal ${signalId}`);
  } catch (error) {
    console.error(`Error creating price targets for signal ${signalId}:`, error);
    throw error;
  }
}
