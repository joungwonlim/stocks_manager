import { pgTable, text, serial, integer, decimal, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

// 주식 정보 테이블
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(), // 티커 심볼 (예: AAPL, 005930)
  name: varchar("name", { length: 255 }).notNull(),
  market: varchar("market", { length: 50 }), // KOSPI, KOSDAQ, NASDAQ, NYSE 등
  currency: varchar("currency", { length: 10 }).default("KRW"), // KRW, USD 등
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 거래 내역 테이블
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
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

// 관계 정의
export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
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
