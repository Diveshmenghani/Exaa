# HICA Staking Protocol

## Overview

HICA is a comprehensive DeFi staking platform that allows users to stake tokens for rewards over various lock periods (1, 2, or 3 years) with an integrated multi-level referral system. The platform features token swapping capabilities between USDT and HICA tokens at a 1:1 rate, staking with APY rewards that increase based on lock duration, and a 25-level referral commission structure. Built with a modern full-stack architecture using React/TypeScript on the frontend and Express.js with PostgreSQL on the backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with a dark theme and vibrant color palette featuring hyper colors and gradients
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations with PostgreSQL
- **API Design**: RESTful API structure with dedicated route handlers for users, stakes, referrals, and token swaps
- **Development**: TSX for TypeScript execution in development mode
- **Data Storage**: Hybrid approach with in-memory storage class for development and PostgreSQL for production

### Database Schema
- **Users Table**: Wallet addresses, referral codes, staking totals, earnings tracking
- **Stakes Table**: Individual stake records with amounts, lock periods, APY rates, and status tracking
- **Referrals Table**: Multi-level referral relationships with commission rates and earnings
- **Token Swaps Table**: Buy/sell transaction history between USDT and HICA tokens
- **Contract Settings Table**: Global platform configuration and emergency controls

### Authentication & Security
- **Wallet-Based Authentication**: Users authenticate using cryptocurrency wallet addresses (MetaMask integration planned)
- **No Traditional Authentication**: No passwords or traditional login systems - purely wallet-based identification
- **Mock Wallet**: Development environment uses mock wallet address generation for testing

### Business Logic Features
- **Staking Rewards**: Monthly APY rates of 10%, 12%, and 15% for 1, 2, and 3-year lock periods respectively
- **Referral System**: 25-level deep commission structure with rates from 12% (level 1) down to 0.25% (levels 21-25)
- **Token Economics**: 1:1 USDT to HICA token swap ratio with approval mechanisms
- **Emergency Features**: Contract pause functionality and emergency unstaking capabilities

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database connection
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration tools for PostgreSQL
- **@tanstack/react-query**: Server state management and data fetching
- **wouter**: Lightweight React router

### UI and Styling Dependencies
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives (dialogs, dropdowns, forms, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development and Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the entire application
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development

### Validation and Forms
- **zod**: Schema validation library
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers

### Additional Features
- **date-fns**: Date manipulation and formatting
- **embla-carousel-react**: Carousel/slider components
- **cmdk**: Command palette interface
- **nanoid**: Unique ID generation