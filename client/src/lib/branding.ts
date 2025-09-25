// Centralized branding configuration for Zeritheum
import logoPath from '@assets/WhatsApp Image 2025-09-24 at 20.34.41_2f4382c2_1758811844549.jpg';

export const BRANDING = {
  APP_NAME: 'Zeritheum',
  APP_TAGLINE: 'The Future of Digital Currency',
  COIN_TICKER: 'ZE',
  STAKED_DERIVATIVE: 'osZE',
  CURRENCY_SYMBOL: 'ZE',
  LOGO_PATH: logoPath,
  // Pricing placeholder (can be dynamic)
  DEFAULT_PRICE_USD: 3977.64,
} as const;

export const APP_NAME = BRANDING.APP_NAME;
export const COIN_TICKER = BRANDING.COIN_TICKER;
export const STAKED_DERIVATIVE = BRANDING.STAKED_DERIVATIVE;
export const CURRENCY_SYMBOL = BRANDING.CURRENCY_SYMBOL;
export const LOGO_PATH = BRANDING.LOGO_PATH;