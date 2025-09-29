import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStakeSchema, insertTokenSwapSchema, insertRoadmapItemSchema, insertEcosystemLinkSchema } from "@shared/schema";
import { z } from "zod";

const REFERRAL_COMMISSION_RATES = [
  { level: 1, rate: 12 },
  { level: 2, rate: 8 },
  { level: 3, rate: 6 },
  { level: 4, rate: 4 },
  { level: 5, rate: 2 },
  { level: 6, rate: 1 },
  { level: 7, rate: 1 },
  { level: 8, rate: 1 },
  { level: 9, rate: 1 },
  { level: 10, rate: 1 },
  { level: 11, rate: 0.75 },
  { level: 12, rate: 0.75 },
  { level: 13, rate: 0.75 },
  { level: 14, rate: 0.75 },
  { level: 15, rate: 0.75 },
  { level: 16, rate: 0.5 },
  { level: 17, rate: 0.5 },
  { level: 18, rate: 0.5 },
  { level: 19, rate: 0.5 },
  { level: 20, rate: 0.5 },
  { level: 21, rate: 0.25 },
  { level: 22, rate: 0.25 },
  { level: 23, rate: 0.25 },
  { level: 24, rate: 0.25 },
  { level: 25, rate: 0.25 },
];

const APY_RATES = {
  12: 10, // 1 year = 10% monthly
  24: 12, // 2 years = 12% monthly  
  36: 15, // 3 years = 15% monthly
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users/register", async (req, res) => {
    try {
      const registerSchema = insertUserSchema.extend({
        walletAddress: z.string().min(1),
        referralCode: z.string().optional(),
        referrerCode: z.string().optional(),
      });
      
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByWallet(data.walletAddress);
      if (existingUser) {
        return res.status(400).json({ message: "User already registered" });
      }
      
      let referrerId = undefined;
      if (data.referrerCode) {
        const referrer = await storage.getUserByReferralCode(data.referrerCode);
        if (referrer) {
          referrerId = referrer.id;
        }
      }
      
      const user = await storage.createUser({
        walletAddress: data.walletAddress,
        referralCode: data.referralCode,
        referrerId,
        totalStaked: "0",
        totalEarned: "0",
        referralEarnings: "0",
        totalReferrals: 0,
        isRegistered: true,
      });
      
      // Create referral chain if user has referrer
      if (referrerId) {
        await createReferralChain(user.id, referrerId);
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });
  
  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const user = await storage.getUserByWallet(req.params.walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Staking routes
  app.post("/api/stakes", async (req, res) => {
    try {
      const stakeSchema = insertStakeSchema.extend({
        userId: z.string(), // This will be walletAddress
        amount: z.string(),
        lockPeriodMonths: z.number().int().min(12).max(36),
      });
      
      const data = stakeSchema.parse(req.body);
      
      // Resolve walletAddress to internal user ID
      const user = await storage.getUserByWallet(data.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found. Please register first." });
      }
      
      // Validate lock period is valid
      if (![12, 24, 36].includes(data.lockPeriodMonths)) {
        return res.status(400).json({ message: "Invalid lock period" });
      }
      
      const apyRate = APY_RATES[data.lockPeriodMonths as keyof typeof APY_RATES];
      
      const stake = await storage.createStake({
        userId: user.id, // Use internal user ID
        amount: data.amount,
        lockPeriodMonths: data.lockPeriodMonths,
        apyRate: apyRate.toString(),
      });
      
      // Update user's total staked
      const newTotalStaked = (parseFloat(user.totalStaked || "0") + parseFloat(data.amount)).toString();
      await storage.updateUser(user.id, { totalStaked: newTotalStaked });
      
      res.json(stake);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });
  
  app.get("/api/stakes/user/:walletAddress", async (req, res) => {
    try {
      // Resolve walletAddress to internal user ID
      const user = await storage.getUserByWallet(req.params.walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const stakes = await storage.getStakesByUserId(user.id);
      
      // Check which stakes can be unstaked (past end date)
      const now = new Date();
      const updatedStakes = await Promise.all(stakes.map(async (stake) => {
        if (!stake.canUnstake && stake.endDate <= now) {
          return await storage.updateStake(stake.id, { canUnstake: true }) || stake;
        }
        return stake;
      }));
      
      res.json(updatedStakes);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/stakes/:id/unstake", async (req, res) => {
    try {
      const stake = await storage.getStake(req.params.id);
      if (!stake) {
        return res.status(404).json({ message: "Stake not found" });
      }
      
      if (!stake.canUnstake) {
        return res.status(400).json({ message: "Stake cannot be unstaked yet" });
      }
      
      if (!stake.isActive) {
        return res.status(400).json({ message: "Stake is already inactive" });
      }
      
      // Calculate final rewards
      const monthsStaked = Math.floor((new Date().getTime() - (stake.startDate?.getTime() || 0)) / (1000 * 60 * 60 * 24 * 30));
      const monthlyReward = (parseFloat(stake.amount) * parseFloat(stake.apyRate)) / 100;
      const totalRewards = monthlyReward * monthsStaked;
      
      const updatedStake = await storage.updateStake(req.params.id, {
        isActive: false,
        earnedAmount: totalRewards.toString(),
      });
      
      // Update user's total earned
      const user = await storage.getUser(stake.userId);
      if (user) {
        const newTotalEarned = (parseFloat(user.totalEarned || "0") + totalRewards).toString();
        await storage.updateUser(stake.userId, { totalEarned: newTotalEarned });
      }
      
      res.json(updatedStake);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/stakes/:id/emergency-unstake", async (req, res) => {
    try {
      const contractSettings = await storage.getContractSettings();
      if (!contractSettings.isPaused || !contractSettings.emergencyUnstakeEnabled) {
        return res.status(400).json({ message: "Emergency unstake not available" });
      }
      
      const stake = await storage.getStake(req.params.id);
      if (!stake || !stake.isActive) {
        return res.status(400).json({ message: "Invalid stake" });
      }
      
      const updatedStake = await storage.updateStake(req.params.id, {
        isActive: false,
        earnedAmount: "0", // No rewards in emergency unstake
      });
      
      res.json(updatedStake);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Token swap routes
  app.post("/api/swaps/buy", async (req, res) => {
    try {
      const swapSchema = insertTokenSwapSchema.extend({
        userId: z.string(), // This will be walletAddress
        amount: z.string(),
      });
      
      const data = swapSchema.parse(req.body);
      
      // Resolve walletAddress to internal user ID
      const user = await storage.getUserByWallet(data.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found. Please register first." });
      }
      
      const swap = await storage.createSwap({
        userId: user.id, // Use internal user ID
        fromToken: "USDT",
        toToken: "HICA",
        amount: data.amount,
        swapType: "buy",
      });
      
      res.json(swap);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });
  
  app.post("/api/swaps/sell", async (req, res) => {
    try {
      const swapSchema = insertTokenSwapSchema.extend({
        userId: z.string(), // This will be walletAddress
        amount: z.string(),
      });
      
      const data = swapSchema.parse(req.body);
      
      // Resolve walletAddress to internal user ID
      const user = await storage.getUserByWallet(data.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found. Please register first." });
      }
      
      const swap = await storage.createSwap({
        userId: user.id, // Use internal user ID
        fromToken: "HICA",
        toToken: "USDT", 
        amount: data.amount,
        swapType: "sell",
      });
      
      res.json(swap);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });
  
  // Referral routes
  app.get("/api/referrals/:userId", async (req, res) => {
    try {
      // userId here is actually the internal user ID, so no need to resolve
      const referrals = await storage.getReferralsByReferrerId(req.params.userId);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/referrals/claim", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // userId here is the internal user ID, so use it directly
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const claimableAmount = user.referralEarnings || "0";
      if (parseFloat(claimableAmount) <= 0) {
        return res.status(400).json({ message: "No rewards to claim" });
      }
      
      // Reset referral earnings and add to total earned
      const newTotalEarned = (parseFloat(user.totalEarned || "0") + parseFloat(claimableAmount)).toString();
      await storage.updateUser(userId, {
        referralEarnings: "0",
        totalEarned: newTotalEarned,
      });
      
      res.json({ claimed: claimableAmount, newTotal: newTotalEarned });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Contract settings routes
  app.get("/api/contract/settings", async (req, res) => {
    try {
      const settings = await storage.getContractSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/contract/settings", async (req, res) => {
    try {
      const updateSchema = z.object({
        isPaused: z.boolean().optional(),
        emergencyUnstakeEnabled: z.boolean().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const settings = await storage.updateContractSettings(updates);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Admin endpoint to recalculate total referrals (fix incorrect counts)
  app.post("/api/admin/recalculate-referrals", async (req, res) => {
    try {
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      for (const user of allUsers) {
        // Count only level 1 (direct) referrals for this user
        const directReferrals = await storage.getReferralsByReferrerId(user.id);
        const level1Count = directReferrals.filter(r => r.level === 1).length;
        
        // Update the user's totalReferrals
        await storage.updateUser(user.id, {
          totalReferrals: level1Count,
        });
      }
      
      res.json({ message: "Total referrals recalculated successfully" });
    } catch (error) {
      console.error("Error recalculating referrals:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Roadmap routes
  app.get("/api/roadmap", async (req, res) => {
    try {
      const roadmapItems = await storage.getAllRoadmapItems();
      res.json(roadmapItems);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/roadmap/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["planned", "in_progress", "completed"]).optional(),
        title: z.string().optional(),
        description: z.string().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const updatedItem = await storage.updateRoadmapItem(req.params.id, updates);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Roadmap item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Ecosystem routes
  app.get("/api/ecosystem", async (req, res) => {
    try {
      const ecosystemLinks = await storage.getAllEcosystemLinks();
      res.json(ecosystemLinks);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Telegram routes
  app.post("/api/telegram/verify", async (req, res) => {
    try {
      const verifySchema = z.object({
        userId: z.string(),
        telegramId: z.string(),
        // Additional telegram verification fields can be added here
        hash: z.string().optional(),
        auth_date: z.number().optional(),
      });
      
      const data = verifySchema.parse(req.body);
      
      // TODO: Verify telegram login hash with bot token
      // For now, just update the user's telegram ID
      const updatedUser = await storage.updateUserTelegramId(data.userId, data.telegramId);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Telegram account linked successfully", user: updatedUser });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

async function createReferralChain(userId: string, referrerId: string, currentLevel: number = 1) {
  if (currentLevel > 25) return;
  
  const commissionData = REFERRAL_COMMISSION_RATES.find(c => c.level === currentLevel);
  if (!commissionData) return;
  
  // Create referral relationship
  await storage.createReferral({
    referrerId,
    referredId: userId,
    level: currentLevel,
    commissionRate: commissionData.rate.toString(),
  });
  
  // Update referrer's total referrals (only for direct referrals - level 1)
  const referrer = await storage.getUser(referrerId);
  if (referrer) {
    if (currentLevel === 1) {
      await storage.updateUser(referrerId, {
        totalReferrals: (referrer.totalReferrals || 0) + 1,
      });
    }
    
    // Continue chain to next level
    if (referrer.referrerId) {
      await createReferralChain(userId, referrer.referrerId, currentLevel + 1);
    }
  }
}
