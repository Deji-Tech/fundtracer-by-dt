// ============================================================
// FundTracer by DT - Transaction Provider Interface
// Common interface for Alchemy and Etherscan providers
// ============================================================

import {
    ChainId,
    Transaction,
    WalletInfo,
    TokenTransfer,
    FilterOptions,
    FundingNode,
} from '../types.js';

/**
 * Interface that all transaction providers must implement
 * This allows us to use either Alchemy or Etherscan interchangeably
 */
export interface ITransactionProvider {
    /** Chain ID */
    readonly chainId: ChainId;

    /** Chain name */
    readonly chainName: string;

    /** Get wallet info (balance, tx count, etc) */
    getWalletInfo(address: string): Promise<WalletInfo>;

    /** Get all transactions for an address */
    getTransactions(address: string, filters?: FilterOptions): Promise<Transaction[]>;

    /** Get internal transactions */
    getInternalTransactions(address: string, filters?: FilterOptions): Promise<Transaction[]>;

    /** Get token transfers */
    getTokenTransfers(address: string, filters?: FilterOptions): Promise<TokenTransfer[]>;

    /** Get first funder of an address */
    getFirstFunder(address: string): Promise<FundingNode | null>;

    /** Get contract code */
    getCode(address: string): Promise<string>;

    /** Clear cache (optional) */
    clearCache?(): void;
}
