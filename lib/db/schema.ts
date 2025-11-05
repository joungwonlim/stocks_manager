import { pgTable, text, serial, integer, decimal, timestamp, varchar, boolean, index, uniqueIndex, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// 기본 테이블 (사용자, 포트폴리오)
// ============================================

// 사용자 테이블
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 포트폴리오 테이블
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 주식 정보 테이블 (확장)
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(), // 티커 심볼 (예: AAPL, 005930)
  name: varchar("name", { length: 255 }).notNull(),
  market: varchar("market", { length: 50 }), // KOSPI, KOSDAQ, NASDAQ, NYSE 등
  currency: varchar("currency", { length: 10 }).default("KRW"), // KRW, USD 등
  exchange: varchar("exchange", { length: 50 }), // 거래소 (KRX, NASDAQ, NYSE 등)
  sector: varchar("sector", { length: 100 }), // 섹터 (기술, 금융, 헬스케어 등)
  isActive: boolean("is_active").default(true), // 활성 상태
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// 실시간 주가 데이터
// ============================================

// 가격 캔들 데이터 (1분/5분/15분/1시간 등)
export const priceCandles = pgTable("price_candles", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  timeframe: varchar("timeframe", { length: 10 }).notNull(), // '1m', '5m', '15m', '1h', '1d'
  timestamp: timestamp("timestamp").notNull(), // 캔들 시작 시간
  open: decimal("open", { precision: 15, scale: 4 }).notNull(), // 시가
  high: decimal("high", { precision: 15, scale: 4 }).notNull(), // 고가
  low: decimal("low", { precision: 15, scale: 4 }).notNull(), // 저가
  close: decimal("close", { precision: 15, scale: 4 }).notNull(), // 종가
  volume: decimal("volume", { precision: 20, scale: 2 }).notNull(), // 거래량
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  stockTimeIdx: uniqueIndex("stock_time_idx").on(table.stockId, table.timeframe, table.timestamp),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

// 기술적 지표 (RSI, MACD, 볼린저 밴드 등)
export const technicalIndicators = pgTable("technical_indicators", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  timeframe: varchar("timeframe", { length: 10 }).notNull(), // '1m', '5m', '15m', '1h', '1d'
  timestamp: timestamp("timestamp").notNull(),

  // 이동평균선
  sma20: decimal("sma_20", { precision: 15, scale: 4 }), // 20일 단순이동평균
  sma50: decimal("sma_50", { precision: 15, scale: 4 }), // 50일 단순이동평균
  sma200: decimal("sma_200", { precision: 15, scale: 4 }), // 200일 단순이동평균
  ema12: decimal("ema_12", { precision: 15, scale: 4 }), // 12일 지수이동평균
  ema26: decimal("ema_26", { precision: 15, scale: 4 }), // 26일 지수이동평균

  // RSI (상대강도지수)
  rsi14: decimal("rsi_14", { precision: 5, scale: 2 }), // 14일 RSI

  // MACD
  macd: decimal("macd", { precision: 15, scale: 4 }), // MACD 라인
  macdSignal: decimal("macd_signal", { precision: 15, scale: 4 }), // 시그널 라인
  macdHistogram: decimal("macd_histogram", { precision: 15, scale: 4 }), // 히스토그램

  // 볼린저 밴드
  bbUpper: decimal("bb_upper", { precision: 15, scale: 4 }), // 상단 밴드
  bbMiddle: decimal("bb_middle", { precision: 15, scale: 4 }), // 중간 밴드
  bbLower: decimal("bb_lower", { precision: 15, scale: 4 }), // 하단 밴드

  // 스토캐스틱
  stochK: decimal("stoch_k", { precision: 5, scale: 2 }), // %K
  stochD: decimal("stoch_d", { precision: 5, scale: 2 }), // %D

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  stockTimeIndicatorIdx: uniqueIndex("stock_time_indicator_idx").on(table.stockId, table.timeframe, table.timestamp),
}));

// ============================================
// AI 분석 및 신호
// ============================================

// Claude AI 분석 결과
export const aiAnalysis = pgTable("ai_analysis", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  analysisType: varchar("analysis_type", { length: 50 }).notNull(), // 'technical', 'trend', 'pattern', 'recommendation'
  timeframe: varchar("timeframe", { length: 10 }).notNull(), // '1m', '5m', '1h', '1d'
  timestamp: timestamp("timestamp").notNull(),

  // AI 분석 내용
  sentiment: varchar("sentiment", { length: 20 }), // 'bullish', 'bearish', 'neutral'
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 신뢰도 (0-100%)
  analysis: text("analysis").notNull(), // AI의 상세 분석 내용
  reasoning: json("reasoning"), // 분석 근거 (JSON)

  // 추천 사항
  recommendation: varchar("recommendation", { length: 20 }), // 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  stockAnalysisIdx: index("stock_analysis_idx").on(table.stockId, table.timestamp),
}));

// 매매 신호
export const tradingSignals = pgTable("trading_signals", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  aiAnalysisId: integer("ai_analysis_id").references(() => aiAnalysis.id),

  signalType: varchar("signal_type", { length: 20 }).notNull(), // 'buy', 'sell', 'hold'
  signalStrength: varchar("signal_strength", { length: 20 }).notNull(), // 'strong', 'moderate', 'weak'

  // 가격 정보
  currentPrice: decimal("current_price", { precision: 15, scale: 4 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 15, scale: 4 }), // 진입가 (매수 추천가)

  // 목표가 및 손절가
  targetPrice1: decimal("target_price_1", { precision: 15, scale: 4 }), // 1차 목표가
  targetPrice2: decimal("target_price_2", { precision: 15, scale: 4 }), // 2차 목표가
  targetPrice3: decimal("target_price_3", { precision: 15, scale: 4 }), // 3차 목표가
  stopLossPrice: decimal("stop_loss_price", { precision: 15, scale: 4 }), // 손절가

  // 기대 수익률
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }), // 기대 수익률 (%)
  riskRewardRatio: decimal("risk_reward_ratio", { precision: 5, scale: 2 }), // 위험/보상 비율

  // 신호 상태
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'executed', 'cancelled', 'expired'
  expiresAt: timestamp("expires_at"), // 신호 만료 시간

  reason: text("reason"), // 신호 발생 이유
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  stockSignalIdx: index("stock_signal_idx").on(table.stockId, table.status),
  timestampIdx: index("signal_timestamp_idx").on(table.timestamp),
}));

// 목표가 관리
export const priceTargets = pgTable("price_targets", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  tradingSignalId: integer("trading_signal_id").references(() => tradingSignals.id),

  targetType: varchar("target_type", { length: 20 }).notNull(), // 'take_profit', 'stop_loss', 'entry'
  targetPrice: decimal("target_price", { precision: 15, scale: 4 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 4 }).notNull(),

  percentage: decimal("percentage", { precision: 5, scale: 2 }), // 현재가 대비 % 차이

  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'reached', 'cancelled'
  reachedAt: timestamp("reached_at"), // 목표가 도달 시간

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  stockTargetIdx: index("stock_target_idx").on(table.stockId, table.status),
}));

// ============================================
// 감시 및 알림
// ============================================

// 관심 종목 (Watchlist)
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),

  priority: integer("priority").default(0), // 우선순위 (0-10)
  notes: text("notes"),

  // 알림 설정
  enablePriceAlert: boolean("enable_price_alert").default(true),
  enableSignalAlert: boolean("enable_signal_alert").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userStockIdx: uniqueIndex("user_stock_idx").on(table.userId, table.stockId),
}));

// 알림
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  tradingSignalId: integer("trading_signal_id").references(() => tradingSignals.id),

  alertType: varchar("alert_type", { length: 50 }).notNull(), // 'price_target', 'trading_signal', 'technical_indicator', 'ai_analysis'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  priority: varchar("priority", { length: 20 }).default("normal"), // 'low', 'normal', 'high', 'urgent'

  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userAlertIdx: index("user_alert_idx").on(table.userId, table.isRead),
}));

// ============================================
// 기존 거래 관련 테이블
// ============================================

// 거래 내역 테이블
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  tradingSignalId: integer("trading_signal_id").references(() => tradingSignals.id), // 신호 기반 거래인 경우

  type: varchar("type", { length: 10 }).notNull(), // 'buy' 또는 'sell'
  quantity: integer("quantity").notNull(), // 수량
  price: decimal("price", { precision: 15, scale: 2 }).notNull(), // 거래 단가
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(), // 총 거래금액
  fee: decimal("fee", { precision: 15, scale: 2 }).default("0"), // 수수료
  transactionDate: timestamp("transaction_date").notNull(), // 거래일시
  notes: text("notes"), // 메모
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 현재 보유 주식 테이블
export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  quantity: integer("quantity").notNull(), // 보유 수량
  averagePrice: decimal("average_price", { precision: 15, scale: 2 }).notNull(), // 평균 매입가
  totalInvested: decimal("total_invested", { precision: 15, scale: 2 }).notNull(), // 총 투자금액
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// 관계 정의
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
  watchlist: many(watchlist),
  alerts: many(alerts),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  holdings: many(holdings),
}));

export const stocksRelations = relations(stocks, ({ many }) => ({
  transactions: many(transactions),
  holdings: many(holdings),
  priceCandles: many(priceCandles),
  technicalIndicators: many(technicalIndicators),
  aiAnalysis: many(aiAnalysis),
  tradingSignals: many(tradingSignals),
  priceTargets: many(priceTargets),
  watchlist: many(watchlist),
  alerts: many(alerts),
}));

export const priceCandlesRelations = relations(priceCandles, ({ one }) => ({
  stock: one(stocks, {
    fields: [priceCandles.stockId],
    references: [stocks.id],
  }),
}));

export const technicalIndicatorsRelations = relations(technicalIndicators, ({ one }) => ({
  stock: one(stocks, {
    fields: [technicalIndicators.stockId],
    references: [stocks.id],
  }),
}));

export const aiAnalysisRelations = relations(aiAnalysis, ({ one, many }) => ({
  stock: one(stocks, {
    fields: [aiAnalysis.stockId],
    references: [stocks.id],
  }),
  tradingSignals: many(tradingSignals),
}));

export const tradingSignalsRelations = relations(tradingSignals, ({ one, many }) => ({
  stock: one(stocks, {
    fields: [tradingSignals.stockId],
    references: [stocks.id],
  }),
  aiAnalysis: one(aiAnalysis, {
    fields: [tradingSignals.aiAnalysisId],
    references: [aiAnalysis.id],
  }),
  priceTargets: many(priceTargets),
  transactions: many(transactions),
  alerts: many(alerts),
}));

export const priceTargetsRelations = relations(priceTargets, ({ one }) => ({
  stock: one(stocks, {
    fields: [priceTargets.stockId],
    references: [stocks.id],
  }),
  tradingSignal: one(tradingSignals, {
    fields: [priceTargets.tradingSignalId],
    references: [tradingSignals.id],
  }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id],
  }),
  stock: one(stocks, {
    fields: [watchlist.stockId],
    references: [stocks.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  stock: one(stocks, {
    fields: [alerts.stockId],
    references: [stocks.id],
  }),
  tradingSignal: one(tradingSignals, {
    fields: [alerts.tradingSignalId],
    references: [tradingSignals.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [transactions.portfolioId],
    references: [portfolios.id],
  }),
  stock: one(stocks, {
    fields: [transactions.stockId],
    references: [stocks.id],
  }),
  tradingSignal: one(tradingSignals, {
    fields: [transactions.tradingSignalId],
    references: [tradingSignals.id],
  }),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [holdings.portfolioId],
    references: [portfolios.id],
  }),
  stock: one(stocks, {
    fields: [holdings.stockId],
    references: [stocks.id],
  }),
}));
