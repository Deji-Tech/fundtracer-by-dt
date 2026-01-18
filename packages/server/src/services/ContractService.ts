/**
 * ContractService - Provides fast lookup of known contract information
 * Auto-refreshes from Lineascan to keep data up-to-date
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Use process.cwd() for consistent path resolution in both dev and production
// In production (Pxxl), CWD is typically /app
const DATA_FILE = process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'src/data/known_contracts.json')
    : path.join(process.cwd(), 'packages/server/src/data/known_contracts.json');

export interface ContractInfo {
    name: string;
    type: 'token' | 'protocol' | 'contract';
    source: string;
    symbol?: string;
    url?: string;
    decimals?: number;
}

class ContractService {
    private contracts: Map<string, ContractInfo> = new Map();
    private lastRefresh: number = 0;
    private refreshInterval: number = 5 * 60 * 1000; // 5 minutes
    private isRefreshing: boolean = false;
    private initialized: boolean = false;

    private lookupQueue: Set<string> = new Set();
    private isProcessingQueue: boolean = false;

    constructor() {
        this.loadContracts();
    }

    /**
     * Queue a contract for background lookup
     */
    queueLookup(address: string): void {
        const addr = address.toLowerCase();
        // Don't queue if already known or already queued
        if (!this.contracts.has(addr) && !this.lookupQueue.has(addr)) {
            this.lookupQueue.add(addr);
            if (!this.isProcessingQueue) {
                this.processLookupQueue().catch(console.error);
            }
        }
    }

    /**
     * Process the background lookup queue
     */
    private async processLookupQueue(): Promise<void> {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;
        console.log('[ContractService] Started processing lookup queue');

        try {
            while (this.lookupQueue.size > 0) {
                // Take one item
                const addr = this.lookupQueue.values().next().value;
                if (!addr) break;

                this.lookupQueue.delete(addr);

                await this.lookupContract(addr);

                // Rate limit: 1 request every 2 seconds to be safe
                await new Promise(r => setTimeout(r, 2000));
            }
            // Save potential new findings
            this.saveContracts();
        } catch (error) {
            console.error('[ContractService] Queue processing error:', error);
        } finally {
            this.isProcessingQueue = false;
            console.log('[ContractService] Finished processing lookup queue');
        }
    }

    /**
     * Load contracts from JSON file into memory
     */
    private loadContracts(): void {
        try {
            if (fs.existsSync(DATA_FILE)) {
                const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
                this.contracts = new Map(Object.entries(data));
                console.log(`[ContractService] Loaded ${this.contracts.size} contracts`);
                this.initialized = true;
            }
        } catch (error) {
            console.error('[ContractService] Failed to load contracts:', error);
        }
    }

    /**
     * Get contract info by address
     */
    getContract(address: string): ContractInfo | null {
        if (!address) return null;
        return this.contracts.get(address.toLowerCase()) || null;
    }

    /**
     * Check if an address is a known contract
     */
    isKnownContract(address: string): boolean {
        if (!address) return false;
        return this.contracts.has(address.toLowerCase());
    }

    /**
     * Get contract name, returns formatted address if not found
     */
    getContractName(address: string): string {
        const contract = this.getContract(address);
        if (contract) {
            return contract.symbol ? `${contract.name} (${contract.symbol})` : contract.name;
        }
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Get all contracts
     */
    getAllContracts(): Map<string, ContractInfo> {
        return this.contracts;
    }

    /**
     * Get contract count
     */
    getCount(): number {
        return this.contracts.size;
    }

    /**
     * Save contracts to disk
     */
    private saveContracts(): void {
        try {
            const obj: Record<string, ContractInfo> = {};
            this.contracts.forEach((v, k) => obj[k] = v);
            fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
            console.log(`[ContractService] Saved ${this.contracts.size} contracts to disk`);
        } catch (error) {
            console.error('[ContractService] Failed to save contracts:', error);
        }
    }

    /**
     * Refresh latest contracts from Lineascan (runs in background)
     */
    async refreshLatestContracts(count: number = 50): Promise<number> {
        if (this.isRefreshing) {
            console.log('[ContractService] Refresh already in progress');
            return 0;
        }

        // Check if we need to refresh
        const now = Date.now();
        if (now - this.lastRefresh < this.refreshInterval) {
            return 0;
        }

        this.isRefreshing = true;
        this.lastRefresh = now;
        let added = 0;
        const initialSize = this.contracts.size;

        try {
            console.log(`[ContractService] Refreshing latest ${count} contracts...`);

            // Fetch first 2 pages (50 contracts)
            const pagesToFetch = Math.ceil(count / 25);

            for (let page = 1; page <= pagesToFetch; page++) {
                const url = page === 1
                    ? 'https://lineascan.build/contractsVerified'
                    : `https://lineascan.build/contractsVerified/${page}`;

                try {
                    const response = await axios.get(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 10000
                    });

                    const $ = cheerio.load(response.data);

                    // Extract contracts from table
                    $('table tbody tr').each((_, row) => {
                        const cells = $(row).find('td');
                        const addressLink = $(cells[0]).find('a[href*="/address/0x"]').attr('href');
                        const contractName = $(cells[1]).text().trim();

                        if (addressLink && contractName) {
                            const match = addressLink.match(/0x[a-fA-F0-9]{40}/);
                            if (match) {
                                const addr = match[0].toLowerCase();
                                if (!this.contracts.has(addr)) {
                                    this.contracts.set(addr, {
                                        name: contractName,
                                        type: 'contract',
                                        source: 'lineascan-verified'
                                    });
                                    added++;
                                }
                            }
                        }
                    });
                } catch (e) {
                    console.error(`[ContractService] Error fetching page ${page}`);
                }

                await new Promise(r => setTimeout(r, 200));
            }

            // Save to file if any contracts were added (including by lookups since last save)
            // We compare current size with what we loaded, or just always save if added > 0 OR if we have unsaved lookups
            // Simple logic: if size changed or added > 0, save.
            // But to be safe for lookups, let's just save if size > initialSize (which tracks lookups too? no initialSize is local var)
            // Actually, best is to just save. It's a JSON write every 5 mins.

            this.saveContracts();

        } catch (error) {
            console.error('[ContractService] Refresh error:', error);
        } finally {
            this.isRefreshing = false;
        }

        return added;
    }

    /**
     * Add or update a contract manually
     */
    addContract(address: string, info: ContractInfo): void {
        this.contracts.set(address.toLowerCase(), info);
    }

    /**
     * Lookup contract info from Lineascan (for unknown contracts)
     */
    async lookupContract(address: string): Promise<ContractInfo | null> {
        if (!address || !address.startsWith('0x')) return null;

        const addr = address.toLowerCase();

        // Return cached if exists
        if (this.contracts.has(addr)) {
            return this.contracts.get(addr)!;
        }

        try {
            const response = await axios.get(`https://lineascan.build/address/${address}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            let name = '';
            let type: 'token' | 'contract' = 'contract';
            let symbol: string | undefined;

            // Try to extract token info
            const tokenTitle = $('span.text-secondary.small').first().text().trim();
            if (tokenTitle) {
                const match = tokenTitle.match(/^(.+?)\s*\(([^)]+)\)/);
                if (match) {
                    name = match[1].trim();
                    symbol = match[2].trim();
                    type = 'token';
                }
            }

            // Try page title
            if (!name) {
                const pageTitle = $('title').text();
                const titleMatch = pageTitle.match(/^([^|]+)/);
                if (titleMatch && !titleMatch[1].includes('0x')) {
                    name = titleMatch[1].trim();
                }
            }

            if (name && name.length > 1) {
                const info: ContractInfo = { name, type, source: 'lineascan-lookup', symbol };
                this.contracts.set(addr, info);
                return info;
            }
        } catch (error) {
            // Ignore errors for lookup
        }

        return null;
    }

    /**
     * Batch lookup multiple addresses
     */
    async batchLookup(addresses: string[]): Promise<Map<string, ContractInfo>> {
        const results = new Map<string, ContractInfo>();
        const unknownAddresses = addresses.filter(a => !this.contracts.has(a.toLowerCase()));

        // Return cached for known addresses
        for (const addr of addresses) {
            const cached = this.contracts.get(addr.toLowerCase());
            if (cached) {
                results.set(addr.toLowerCase(), cached);
            }
        }

        // Lookup unknown (with rate limiting)
        for (const addr of unknownAddresses.slice(0, 10)) { // Limit to 10 lookups
            const info = await this.lookupContract(addr);
            if (info) {
                results.set(addr.toLowerCase(), info);
            }
            await new Promise(r => setTimeout(r, 200));
        }

        return results;
    }
}

// Singleton instance
export const contractService = new ContractService();

// Auto-refresh every 5 minutes
setInterval(() => {
    contractService.refreshLatestContracts(50).catch(console.error);
}, 5 * 60 * 1000);

export default contractService;
