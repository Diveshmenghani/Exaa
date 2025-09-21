import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  referralCode: text("referral_code").unique(),
  referrerId: varchar("referrer_id"),
  totalStaked: decimal("total_staked", { precision: 18, scale: 8 }).default("0"),
  totalEarned: decimal("total_earned", { precision: 18, scale: 8 }).default("0"),
  referralEarnings: decimal("referral_earnings", { precision: 18, scale: 8 }).default("0"),
  totalReferrals: integer("total_referrals").default(0),
  isRegistered: boolean("is_registered").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stakes = pgTable("stakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  lockPeriodMonths: integer("lock_period_months").notNull(),
  apyRate: decimal("apy_rate", { precision: 5, scale: 2 }).notNull(),
  earnedAmount: decimal("earned_amount", { precision: 18, scale: 8 }).default("0"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  canUnstake: boolean("can_unstake").default(false),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredId: varchar("referred_id").notNull().references(() => users.id),
  level: integer("level").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  totalEarned: decimal("total_earned", { precision: 18, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokenSwaps = pgTable("token_swaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fromToken: text("from_token").notNull(),
  toToken: text("to_token").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  swapType: text("swap_type").notNull(), // 'buy' or 'sell'
  createdAt: timestamp("created_at").defaultNow(),
});

export const contractSettings = pgTable("contract_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isPaused: boolean("is_paused").default(false),
  emergencyUnstakeEnabled: boolean("emergency_unstake_enabled").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertStakeSchema = createInsertSchema(stakes).omit({
  id: true,
  startDate: true,
  endDate: true,
  earnedAmount: true,
  isActive: true,
  canUnstake: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  totalEarned: true,
});

export const insertTokenSwapSchema = createInsertSchema(tokenSwaps).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Stake = typeof stakes.$inferSelect;
export type InsertStake = z.infer<typeof insertStakeSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type TokenSwap = typeof tokenSwaps.$inferSelect;
export type InsertTokenSwap = z.infer<typeof insertTokenSwapSchema>;
export type ContractSettings = typeof contractSettings.$inferSelect;
