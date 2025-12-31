// Enums for Deterministic State Machine
export enum JobState {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PICKUP_VERIFIED = 'PICKUP_VERIFIED',
  PHASE1_PAID = 'PHASE1_PAID',
  PHASE2_FUNDED = 'PHASE2_FUNDED',
  COMPLETED = 'COMPLETED',
  DISPUTE = 'DISPUTE'
}

export enum UserRole {
  OPERATOR = 'OPERATOR',
  DRIVER = 'DRIVER'
}

export interface Wallet {
  id: string;
  ownerId: string;
  balanceAvailable: number;
  balanceEscrow: number; // For Operator
  balanceReserved: number; // For Driver (Income Guarantee)
  balancePending: number; // For T+1 settlement
  reputation: number; // 0-100 Trust Score
  // Welfare & Metrics
  creditScore: number;
  carbonPoints: number;
  taxWithheld: number;
  tier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export interface Job {
  id: string;
  title: string;
  operatorId: string;
  driverId?: string;
  valueTotal: number;
  state: JobState;
  origin: string;
  destination: string;
  riskScore: number;
  projectedCarbonCredits: number; // New: For Green Tax Shield
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  relatedJobId?: string;
}

// Global App State Interface
export interface AppState {
  currentUserRole: UserRole;
  operatorWallet: Wallet;
  driverWallet: Wallet;
  jobs: Job[];
  ledger: LedgerEntry[];
}

export const CONSTANTS = {
  PLATFORM_FEE_PERCENT: 0.10, // 10%
  PHASE_SPLIT: 0.50, // 50/50
  CARBON_POINT_VALUE_THB: 10, // 1 Point = 10 THB Deduction
};