import { 
  type User, 
  type InsertUser, 
  type Stake, 
  type InsertStake,
  type Referral,
  type InsertReferral,
  type TokenSwap,
  type InsertTokenSwap,
  type ContractSettings,
  type RoadmapItem,
  type InsertRoadmapItem,
  type EcosystemLink,
  type InsertEcosystemLink
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
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
  
  // Roadmap operations
  getAllRoadmapItems(): Promise<RoadmapItem[]>;
  getRoadmapItem(id: string): Promise<RoadmapItem | undefined>;
  createRoadmapItem(item: InsertRoadmapItem): Promise<RoadmapItem>;
  updateRoadmapItem(id: string, updates: Partial<RoadmapItem>): Promise<RoadmapItem | undefined>;
  
  // Ecosystem operations
  getAllEcosystemLinks(): Promise<EcosystemLink[]>;
  getEcosystemLink(id: string): Promise<EcosystemLink | undefined>;
  createEcosystemLink(link: InsertEcosystemLink): Promise<EcosystemLink>;
  updateEcosystemLink(id: string, updates: Partial<EcosystemLink>): Promise<EcosystemLink | undefined>;
  
  // Telegram operations
  updateUserTelegramId(userId: string, telegramId: string): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private stakes: Map<string, Stake> = new Map();
  private referrals: Map<string, Referral> = new Map();
  private tokenSwaps: Map<string, TokenSwap> = new Map();
  private roadmapItems: Map<string, RoadmapItem> = new Map();
  private ecosystemLinks: Map<string, EcosystemLink> = new Map();
  private contractSettings: ContractSettings;

  constructor() {
    // Initialize with default contract settings
    this.contractSettings = {
      id: randomUUID(),
      isPaused: false,
      emergencyUnstakeEnabled: false,
      lastUpdated: new Date(),
    };
    
    // Seed roadmap items
    this.seedRoadmapItems();
    
    // Seed ecosystem links
    this.seedEcosystemLinks();
  }
  
  private seedRoadmapItems() {
    const roadmapData = [
      { level: "L1" as const, title: "Platform Foundation", description: "Successful completion and finalization of our innovative staking platform", status: "completed" as const, sortOrder: 0 },
      { level: "L2" as const, title: "Education Ecosystem Launch", description: "Successful introduction of our innovative educational products to the market", status: "in_progress" as const, sortOrder: 1 },
      { level: "L3" as const, title: "Real Estate Integration", description: "Integration of real estate investment opportunities within our ecosystem", status: "planned" as const, sortOrder: 2 },
      { level: "L4" as const, title: "AI Trading Advisor", description: "Launch of AI-powered trading advisory services and multiple gaming platforms", status: "planned" as const, sortOrder: 3 },
      { level: "L5" as const, title: "Shopping App Launch", description: "Formation of strategic shopping alliance, expanding market presence and capabilities", status: "planned" as const, sortOrder: 4 },
      { level: "L6" as const, title: "AI Astrology Platform", description: "Celebration of reaching substantial user base with AI astrology services", status: "planned" as const, sortOrder: 5 }
    ];
    
    roadmapData.forEach(item => {
      const id = randomUUID();
      const now = new Date();
      this.roadmapItems.set(id, {
        ...item,
        id,
        createdAt: now,
        updatedAt: now,
      });
    });
  }
  
  private seedEcosystemLinks() {
    const ecosystemData = [
      { name: "Education Platform", description: "Online learning and certification platform", category: "Education", iconKey: "graduation-cap", sortOrder: 0, isActive: true, url: null },
      { name: "Real Estate Investment", description: "Tokenized real estate investment opportunities", category: "Real Estate", iconKey: "building", sortOrder: 1, isActive: true, url: null },
      { name: "Shopping Marketplace", description: "Decentralized marketplace for goods and services", category: "Shopping", iconKey: "shopping-cart", sortOrder: 2, isActive: true, url: null },
      { name: "AI Astrology", description: "Personalized astrology readings powered by AI", category: "AI Services", iconKey: "sparkles", sortOrder: 3, isActive: true, url: null },
      { name: "AI Trading Advisor", description: "Smart trading recommendations and market analysis", category: "AI Services", iconKey: "trending-up", sortOrder: 4, isActive: true, url: null },
      { name: "Gaming Platform", description: "Multiple blockchain-based gaming experiences", category: "Gaming", iconKey: "gamepad-2", sortOrder: 5, isActive: true, url: null }
    ];
    
    ecosystemData.forEach(item => {
      const id = randomUUID();
      this.ecosystemLinks.set(id, {
        ...item,
        id,
        createdAt: new Date(),
      });
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress,
    );
    if (user) {
      return user;
    }
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
      telegramId: insertUser.telegramId || null,
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

  // Roadmap operations
  async getAllRoadmapItems(): Promise<RoadmapItem[]> {
    return Array.from(this.roadmapItems.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getRoadmapItem(id: string): Promise<RoadmapItem | undefined> {
    return this.roadmapItems.get(id);
  }

  async createRoadmapItem(insertItem: InsertRoadmapItem): Promise<RoadmapItem> {
    const id = randomUUID();
    const now = new Date();
    const item: RoadmapItem = {
      ...insertItem,
      id,
      status: insertItem.status || "planned",
      sortOrder: insertItem.sortOrder || 0,
      createdAt: now,
      updatedAt: now,
    };
    this.roadmapItems.set(id, item);
    return item;
  }

  async updateRoadmapItem(id: string, updates: Partial<RoadmapItem>): Promise<RoadmapItem | undefined> {
    const item = this.roadmapItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { 
      ...item, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.roadmapItems.set(id, updatedItem);
    return updatedItem;
  }

  // Ecosystem operations
  async getAllEcosystemLinks(): Promise<EcosystemLink[]> {
    return Array.from(this.ecosystemLinks.values())
      .filter(link => link.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getEcosystemLink(id: string): Promise<EcosystemLink | undefined> {
    return this.ecosystemLinks.get(id);
  }

  async createEcosystemLink(insertLink: InsertEcosystemLink): Promise<EcosystemLink> {
    const id = randomUUID();
    const link: EcosystemLink = {
      ...insertLink,
      id,
      isActive: insertLink.isActive !== undefined ? insertLink.isActive : true,
      sortOrder: insertLink.sortOrder || 0,
      createdAt: new Date(),
    };
    this.ecosystemLinks.set(id, link);
    return link;
  }

  async updateEcosystemLink(id: string, updates: Partial<EcosystemLink>): Promise<EcosystemLink | undefined> {
    const link = this.ecosystemLinks.get(id);
    if (!link) return undefined;
    
    const updatedLink = { ...link, ...updates };
    this.ecosystemLinks.set(id, updatedLink);
    return updatedLink;
  }

  // Telegram operations
  async updateUserTelegramId(userId: string, telegramId: string): Promise<User | undefined> {
    return this.updateUser(userId, { telegramId });
  }
}

export const storage = new MemStorage();
