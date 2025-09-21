export const APY_RATES = {
  12: 10, // 1 year = 10% monthly
  24: 12, // 2 years = 12% monthly  
  36: 15, // 3 years = 15% monthly
} as const;

export const REFERRAL_COMMISSION_RATES = [
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
] as const;

export const LOCK_PERIODS = [
  { months: 12, label: "1 Year", apy: 10 },
  { months: 24, label: "2 Years", apy: 12 },
  { months: 36, label: "3 Years", apy: 15 },
] as const;
