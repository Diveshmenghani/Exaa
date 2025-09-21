import { 
  type User, 
  type InsertUser, 
  type Stake, 
  type InsertStake,
  type Referral,
  type InsertReferral,
  type TokenSwap,
  type InsertTokenSwap,
  type ContractSettings
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Stake operations
  getStakesByUserId(userId: string): Promise<Stake[]>;
  getStake(id: string): Promise<Stake | undefined>;
  createStake(stake: InsertStake): Promise<Stake>;
  updateStake(id: string, updates: Partial<Stake>): Promise<Stake | undefined>;
  
  // Referral operations
  getReferralsByReferrerId(referrerId: string): Promise<Referral[]>;
  getReferralsByReferredId(referredId: string): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined>;
  
  // Token swap operations
  getSwapsByUserId(userId: string): Promise<TokenSwap[]>;
  createSwap(swap: InsertTokenSwap): Promise<TokenSwap>;
  
  // Contract settings
  getContractSettings(): Promise<ContractSettings>;
  updateContractSettings(updates: Partial<ContractSettings>): Promise<ContractSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private stakes: Map<string, Stake> = new Map();
  private referrals: Map<string, Referral> = new Map();
  private tokenSwaps: Map<string, TokenSwap> = new Map();
  private contractSettings: ContractSettings;

  constructor() {
    // Initialize with default contract settings
    this.contractSettings = {
      id: randomUUID(),
      isPaused: false,
      emergencyUnstakeEnabled: false,
      lastUpdated: new Date(),
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress,
    );
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      walletAddress: insertUser.walletAddress,
      referralCode: insertUser.referralCode || `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      referrerId: insertUser.referrerId || null,
      totalStaked: insertUser.totalStaked || "0",
      totalEarned: insertUser.totalEarned || "0",
      referralEarnings: insertUser.referralEarnings || "0",
      totalReferrals: insertUser.totalReferrals || 0,
      isRegistered: insertUser.isRegistered || false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Stake operations
  async getStakesByUserId(userId: string): Promise<Stake[]> {
    return Array.from(this.stakes.values()).filter(
      (stake) => stake.userId === userId,
    );
  }

  async getStake(id: string): Promise<Stake | undefined> {
    return this.stakes.get(id);
  }

  async createStake(insertStake: InsertStake): Promise<Stake> {
    const id = randomUUID();
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + insertStake.lockPeriodMonths);
    
    const stake: Stake = {
      ...insertStake,
      id,
      startDate: now,
      endDate,
      earnedAmount: "0",
      isActive: true,
      canUnstake: false,
    };
    this.stakes.set(id, stake);
    return stake;
  }

  async updateStake(id: string, updates: Partial<Stake>): Promise<Stake | undefined> {
    const stake = this.stakes.get(id);
    if (!stake) return undefined;
    
    const updatedStake = { ...stake, ...updates };
    this.stakes.set(id, updatedStake);
    return updatedStake;
  }

  // Referral operations
  async getReferralsByReferrerId(referrerId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      (referral) => referral.referrerId === referrerId,
    );
  }

  async getReferralsByReferredId(referredId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      (referral) => referral.referredId === referredId,
    );
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const referral: Referral = {
      ...insertReferral,
      id,
      createdAt: new Date(),
      totalEarned: "0",
    };
    this.referrals.set(id, referral);
    return referral;
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (!referral) return undefined;
    
    const updatedReferral = { ...referral, ...updates };
    this.referrals.set(id, updatedReferral);
    return updatedReferral;
  }

  // Token swap operations
  async getSwapsByUserId(userId: string): Promise<TokenSwap[]> {
    return Array.from(this.tokenSwaps.values()).filter(
      (swap) => swap.userId === userId,
    );
  }

  async createSwap(insertSwap: InsertTokenSwap): Promise<TokenSwap> {
    const id = randomUUID();
    const swap: TokenSwap = {
      ...insertSwap,
      id,
      createdAt: new Date(),
    };
    this.tokenSwaps.set(id, swap);
    return swap;
  }

  // Contract settings
  async getContractSettings(): Promise<ContractSettings> {
    return this.contractSettings;
  }

  async updateContractSettings(updates: Partial<ContractSettings>): Promise<ContractSettings> {
    this.contractSettings = {
      ...this.contractSettings,
      ...updates,
      lastUpdated: new Date(),
    };
    return this.contractSettings;
  }
}

export const storage = new MemStorage();
