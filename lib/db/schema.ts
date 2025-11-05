import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ============================================
// 기본 테이블 (사용자, 포트폴리오)
// ============================================

// 사용자 테이블
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// 포트폴리오 테이블
export const portfolios = sqliteTable("portfolios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// 주식 정보 테이블 (확장)
export const stocks = sqliteTable("stocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  market: text("market"),
  currency: text("currency").default("KRW"),
  exchange: text("exchange"),
  sector: text("sector"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// ============================================
// 실시간 주가 데이터
// ============================================

// 가격 캔들 데이터
export const priceCandles = sqliteTable("price_candles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  timeframe: text("timeframe").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  open: text("open").notNull(),
  high: text("high").notNull(),
  low: text("low").notNull(),
  close: text("close").notNull(),
  volume: text("volume").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  stockTimeIdx: uniqueIndex("stock_time_idx").on(table.stockId, table.timeframe, table.timestamp),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

// 기술적 지표
export const technicalIndicators = sqliteTable("technical_indicators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  timeframe: text("timeframe").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  sma20: text("sma_20"),
  sma50: text("sma_50"),
  sma200: text("sma_200"),
  ema12: text("ema_12"),
  ema26: text("ema_26"),
  rsi14: text("rsi_14"),
  macd: text("macd"),
  macdSignal: text("macd_signal"),
  macdHistogram: text("macd_histogram"),
  bbUpper: text("bb_upper"),
  bbMiddle: text("bb_middle"),
  bbLower: text("bb_lower"),
  stochK: text("stoch_k"),
  stochD: text("stoch_d"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  stockTimeIndicatorIdx: uniqueIndex("stock_time_indicator_idx").on(table.stockId, table.timeframe, table.timestamp),
}));

// ============================================
// AI 분석 및 신호
// ============================================

// 투자 전략 마스터 데이터
export const tradingStrategies = sqliteTable("trading_strategies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  nameKo: text("name_ko").notNull(),
  nameEn: text("name_en").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  keyIndicators: text("key_indicators", { mode: "json" }),
  riskLevel: text("risk_level"),
  timeHorizon: text("time_horizon"),
  suitableFor: text("suitable_for", { mode: "json" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  priority: integer("priority").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  categoryIdx: index("strategy_category_idx").on(table.category),
  activeIdx: index("strategy_active_idx").on(table.isActive, table.priority),
}));

// Claude AI 분석 결과
export const aiAnalysis = sqliteTable("ai_analysis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  analysisType: text("analysis_type").notNull(),
  timeframe: text("timeframe").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  sentiment: text("sentiment"),
  confidence: text("confidence"),
  analysis: text("analysis").notNull(),
  reasoning: text("reasoning", { mode: "json" }),
  recommendation: text("recommendation"),
  appliedStrategies: text("applied_strategies", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  stockAnalysisIdx: index("stock_analysis_idx").on(table.stockId, table.timestamp),
}));

// AI 분석 - 전략 연결 테이블
export const aiAnalysisStrategies = sqliteTable("ai_analysis_strategies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  aiAnalysisId: integer("ai_analysis_id").notNull().references(() => aiAnalysis.id),
  strategyId: integer("strategy_id").notNull().references(() => tradingStrategies.id),
  applicabilityScore: text("applicability_score"),
  reasoning: text("reasoning"),
  matchedIndicators: text("matched_indicators", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  analysisStrategyIdx: uniqueIndex("analysis_strategy_idx").on(table.aiAnalysisId, table.strategyId),
}));

// 매매 신호
export const tradingSignals = sqliteTable("trading_signals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  aiAnalysisId: integer("ai_analysis_id").references(() => aiAnalysis.id),
  signalType: text("signal_type").notNull(),
  signalStrength: text("signal_strength").notNull(),
  currentPrice: text("current_price").notNull(),
  entryPrice: text("entry_price"),
  targetPrice1: text("target_price_1"),
  targetPrice2: text("target_price_2"),
  targetPrice3: text("target_price_3"),
  stopLossPrice: text("stop_loss_price"),
  expectedReturn: text("expected_return"),
  riskRewardRatio: text("risk_reward_ratio"),
  status: text("status").default("active"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  reason: text("reason"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  stockSignalIdx: index("stock_signal_idx").on(table.stockId, table.status),
  timestampIdx: index("signal_timestamp_idx").on(table.timestamp),
}));

// 목표가 관리
export const priceTargets = sqliteTable("price_targets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  tradingSignalId: integer("trading_signal_id").references(() => tradingSignals.id),
  targetType: text("target_type").notNull(),
  targetPrice: text("target_price").notNull(),
  currentPrice: text("current_price").notNull(),
  percentage: text("percentage"),
  status: text("status").default("pending"),
  reachedAt: integer("reached_at", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  stockTargetIdx: index("stock_target_idx").on(table.stockId, table.status),
}));

// ============================================
// 뉴스 및 정보 수집
// ============================================

// 뉴스 소스
export const newsSources = sqliteTable("news_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  collectionMethod: text("collection_method").notNull(),
  rssUrl: text("rss_url"),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  collectionFrequency: text("collection_frequency").default("daily"),
  lastCollectedAt: integer("last_collected_at", { mode: "timestamp" }),
  language: text("language").default("ko"),
  country: text("country").default("KR"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  nameIdx: index("news_source_name_idx").on(table.name),
  categoryIdx: index("news_source_category_idx").on(table.category),
}));

// 뉴스 기사
export const newsArticles = sqliteTable("news_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").notNull().references(() => newsSources.id),
  title: text("title").notNull(),
  content: text("content"),
  summary: text("summary"),
  url: text("url").notNull().unique(),
  author: text("author"),
  publishedAt: integer("published_at", { mode: "timestamp" }).notNull(),
  category: text("category"),
  tags: text("tags", { mode: "json" }),
  sentiment: text("sentiment"),
  sentimentScore: text("sentiment_score"),
  importance: integer("importance").default(0),
  mentionedStocks: text("mentioned_stocks", { mode: "json" }),
  contentHash: text("content_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  sourcePublishedIdx: index("news_source_published_idx").on(table.sourceId, table.publishedAt),
  publishedIdx: index("news_published_idx").on(table.publishedAt),
  sentimentIdx: index("news_sentiment_idx").on(table.sentiment),
  contentHashIdx: uniqueIndex("news_content_hash_idx").on(table.contentHash),
}));

// 종목-뉴스 연관성
export const stockNewsRelations = sqliteTable("stock_news_relations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  newsArticleId: integer("news_article_id").notNull().references(() => newsArticles.id),
  relevanceScore: text("relevance_score").notNull(),
  mentionType: text("mention_type"),
  impact: text("impact"),
  impactScore: text("impact_score"),
  excerpt: text("excerpt"),
  keywords: text("keywords", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  stockNewsIdx: uniqueIndex("stock_news_idx").on(table.stockId, table.newsArticleId),
  stockRelevanceIdx: index("stock_relevance_idx").on(table.stockId, table.relevanceScore),
}));

// 뉴스 수집 로그
export const newsCollectionLogs = sqliteTable("news_collection_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").notNull().references(() => newsSources.id),
  status: text("status").notNull(),
  articlesCollected: integer("articles_collected").default(0),
  articlesNew: integer("articles_new").default(0),
  articlesDuplicate: integer("articles_duplicate").default(0),
  errorMessage: text("error_message"),
  duration: integer("duration"),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  sourceStatusIdx: index("collection_source_status_idx").on(table.sourceId, table.status),
  startedAtIdx: index("collection_started_idx").on(table.startedAt),
}));

// ============================================
// 감시 및 알림
// ============================================

// 관심 종목
export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  priority: integer("priority").default(0),
  notes: text("notes"),
  enablePriceAlert: integer("enable_price_alert", { mode: "boolean" }).default(true),
  enableSignalAlert: integer("enable_signal_alert", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userStockIdx: uniqueIndex("user_stock_idx").on(table.userId, table.stockId),
}));

// 알림
export const alerts = sqliteTable("alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  tradingSignalId: integer("trading_signal_id").references(() => tradingSignals.id),
  alertType: text("alert_type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("normal"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userAlertIdx: index("user_alert_idx").on(table.userId, table.isRead),
}));

// ============================================
// 거래 관련 테이블
// ============================================

// 거래 내역 테이블
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  tradingSignalId: integer("trading_signal_id").references(() => tradingSignals.id),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  price: text("price").notNull(),
  totalAmount: text("total_amount").notNull(),
  fee: text("fee").default("0"),
  transactionDate: integer("transaction_date", { mode: "timestamp" }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// 현재 보유 주식 테이블
export const holdings = sqliteTable("holdings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  quantity: integer("quantity").notNull(),
  averagePrice: text("average_price").notNull(),
  totalInvested: text("total_invested").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
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
  stockNewsRelations: many(stockNewsRelations),
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
  strategyLinks: many(aiAnalysisStrategies),
}));

export const tradingStrategiesRelations = relations(tradingStrategies, ({ many }) => ({
  analysisLinks: many(aiAnalysisStrategies),
}));

export const aiAnalysisStrategiesRelations = relations(aiAnalysisStrategies, ({ one }) => ({
  aiAnalysis: one(aiAnalysis, {
    fields: [aiAnalysisStrategies.aiAnalysisId],
    references: [aiAnalysis.id],
  }),
  strategy: one(tradingStrategies, {
    fields: [aiAnalysisStrategies.strategyId],
    references: [tradingStrategies.id],
  }),
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

export const newsSourcesRelations = relations(newsSources, ({ many }) => ({
  newsArticles: many(newsArticles),
  collectionLogs: many(newsCollectionLogs),
}));

export const newsArticlesRelations = relations(newsArticles, ({ one, many }) => ({
  source: one(newsSources, {
    fields: [newsArticles.sourceId],
    references: [newsSources.id],
  }),
  stockRelations: many(stockNewsRelations),
}));

export const stockNewsRelationsRelations = relations(stockNewsRelations, ({ one }) => ({
  stock: one(stocks, {
    fields: [stockNewsRelations.stockId],
    references: [stocks.id],
  }),
  newsArticle: one(newsArticles, {
    fields: [stockNewsRelations.newsArticleId],
    references: [newsArticles.id],
  }),
}));

export const newsCollectionLogsRelations = relations(newsCollectionLogs, ({ one }) => ({
  source: one(newsSources, {
    fields: [newsCollectionLogs.sourceId],
    references: [newsSources.id],
  }),
}));
