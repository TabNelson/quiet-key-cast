/**
 * TypeScript type definitions for the application
 */

// Election types
export interface Election {
  id: number;
  title: string;
  description: string;
  candidateCount: bigint;
  candidateNames: string[];
  endTime: bigint;
  isActive: boolean;
  isFinalized: boolean;
  admin: string;
  totalVoters: bigint;
}

export interface ElectionFormData {
  title: string;
  description: string;
  candidates: string[];
  duration: number; // in hours
}

export interface VoteData {
  electionId: number;
  candidateIndex: number;
}

// Network types
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
  isTestnet: boolean;
}

// FHE types
export interface EncryptedVote {
  handles: string[];
  inputProof: string;
}

export interface DecryptionResult {
  average: number;
  count: number;
}

// UI types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ElectionStats {
  totalElections: number;
  activeElections: number;
  totalVotes: number;
  uniqueVoters: number;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ContractError extends AppError {
  constructor(message: string, public contractAddress?: string) {
    super(message, 'CONTRACT_ERROR');
    this.name = 'ContractError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, public chainId?: number) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class EncryptionError extends AppError {
  constructor(message: string) {
    super(message, 'ENCRYPTION_ERROR');
    this.name = 'EncryptionError';
  }
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Hook return types
export interface UseElectionContractReturn {
  getElectionCount: () => Promise<number>;
  getElection: (id: number) => Promise<Election>;
  hasUserVoted: (electionId: number) => Promise<boolean>;
  createElection: (data: ElectionFormData) => Promise<boolean>;
  castVote: (electionId: number, candidateIndex: number) => Promise<boolean>;
  endElection: (electionId: number) => Promise<boolean>;
  finalizeElection: (electionId: number) => Promise<boolean>;
  getDecryptedVoteSum: (electionId: number) => Promise<number | null>;
  contractDeployed: boolean;
  isLoading: boolean;
}
