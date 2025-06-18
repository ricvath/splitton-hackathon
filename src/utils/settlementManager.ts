import { tonConnectManager, Settlement } from '../ton/connect';
import { currencyManager } from './currencyManager';
import { CloudParticipant } from '../storage/types';

export interface DebtRelation {
  from: string; // Telegram ID
  to: string; // Telegram ID
  amount: number; // Amount in fiat currency
  currency: string;
}

export interface SettlementPlan {
  settlements: Settlement[];
  totalAmount: number;
  currency: string;
  canExecute: boolean; // Whether all participants have connected wallets
  missingWallets: string[]; // Telegram IDs of participants without wallets
}

export interface SettlementResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class SettlementManager {
  private static instance: SettlementManager;

  static getInstance(): SettlementManager {
    if (!SettlementManager.instance) {
      SettlementManager.instance = new SettlementManager();
    }
    return SettlementManager.instance;
  }

  /**
   * Calculate simplified debts from balance information
   * Uses the algorithm to minimize number of transactions
   */
  calculateSimplifiedDebts(balances: Record<string, number>): DebtRelation[] {
    const debts: DebtRelation[] = [];
    
    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors: Array<{ id: string; amount: number }> = [];
    const debtors: Array<{ id: string; amount: number }> = [];

    Object.entries(balances).forEach(([participantId, balance]) => {
      if (balance > 0.01) { // Creditor (owed money)
        creditors.push({ id: participantId, amount: balance });
      } else if (balance < -0.01) { // Debtor (owes money)
        debtors.push({ id: participantId, amount: Math.abs(balance) });
      }
    });

    // Sort by amount for better optimization
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Create debt relationships
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const settlementAmount = Math.min(creditor.amount, debtor.amount);

      if (settlementAmount > 0.01) { // Only create debt if significant
        debts.push({
          from: debtor.id,
          to: creditor.id,
          amount: Math.round(settlementAmount * 100) / 100, // Round to 2 decimal places
          currency: 'USD', // Default currency, should be passed as parameter
        });
      }

      // Update remaining amounts
      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      // Move to next creditor/debtor if current one is settled
      if (creditor.amount < 0.01) {
        creditorIndex++;
      }
      if (debtor.amount < 0.01) {
        debtorIndex++;
      }
    }

    return debts;
  }

  /**
   * Create a settlement plan with TON conversions
   */
  async createSettlementPlan(
    balances: Record<string, number>,
    participants: CloudParticipant[],
    baseCurrency: string = 'USD'
  ): Promise<SettlementPlan> {
    const debts = this.calculateSimplifiedDebts(balances);
    const settlements: Settlement[] = [];
    const missingWallets: string[] = [];
    let totalAmount = 0;

    for (const debt of debts) {
      const fromParticipant = participants.find(p => p.telegramId === debt.from);
      const toParticipant = participants.find(p => p.telegramId === debt.to);

      if (!fromParticipant || !toParticipant) {
        console.warn('Participant not found for debt:', debt);
        continue;
      }

      // Check if both participants have connected wallets
      if (!fromParticipant.walletAddress) {
        if (!missingWallets.includes(fromParticipant.telegramId)) {
          missingWallets.push(fromParticipant.telegramId);
        }
      }
      if (!toParticipant.walletAddress) {
        if (!missingWallets.includes(toParticipant.telegramId)) {
          missingWallets.push(toParticipant.telegramId);
        }
      }

      if (fromParticipant.walletAddress && toParticipant.walletAddress) {
        try {
          const tonAmount = await currencyManager.convertToTon(debt.amount, baseCurrency);
          
          settlements.push({
            from: fromParticipant.walletAddress,
            to: toParticipant.walletAddress,
            amountFiat: debt.amount,
            amountTon: tonAmount,
            currency: baseCurrency,
            description: `Settlement: ${currencyManager.formatAmount(debt.amount, baseCurrency)}`,
          });

          totalAmount += debt.amount;
        } catch (error) {
          console.error('Failed to convert currency for settlement:', error);
        }
      }
    }

    return {
      settlements,
      totalAmount,
      currency: baseCurrency,
      canExecute: missingWallets.length === 0 && settlements.length > 0,
      missingWallets,
    };
  }

  /**
   * Execute a single settlement
   */
  async executeSettlement(settlement: Settlement): Promise<SettlementResult> {
    try {
      if (!tonConnectManager.isWalletConnected()) {
        return {
          success: false,
          error: 'Wallet not connected',
        };
      }

      const transactionHash = await tonConnectManager.sendSettlement(settlement);
      
      if (transactionHash) {
        return {
          success: true,
          transactionHash,
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed',
        };
      }
    } catch (error) {
      console.error('Settlement execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute multiple settlements in sequence
   */
  async executeSettlementPlan(
    plan: SettlementPlan,
    onProgress?: (completed: number, total: number) => void
  ): Promise<SettlementResult[]> {
    if (!plan.canExecute) {
      throw new Error('Settlement plan cannot be executed - missing wallet connections');
    }

    const results: SettlementResult[] = [];
    
    for (let i = 0; i < plan.settlements.length; i++) {
      const settlement = plan.settlements[i];
      
      // Notify progress
      onProgress?.(i, plan.settlements.length);
      
      const result = await this.executeSettlement(settlement);
      results.push(result);
      
      // If a settlement fails, you might want to continue or stop
      // For now, we continue with all settlements
      if (!result.success) {
        console.warn('Settlement failed:', settlement, result.error);
      }
      
      // Add delay between transactions to avoid rate limiting
      if (i < plan.settlements.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final progress update
    onProgress?.(plan.settlements.length, plan.settlements.length);
    
    return results;
  }

  /**
   * Get settlement summary for display
   */
  getSettlementSummary(plan: SettlementPlan): {
    totalTransactions: number;
    totalAmount: string;
    participantsCount: number;
    readyToExecute: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (plan.missingWallets.length > 0) {
      issues.push(`${plan.missingWallets.length} participant(s) need to connect their wallet`);
    }
    
    if (plan.settlements.length === 0) {
      issues.push('No settlements needed');
    }

    const participantIds = new Set([
      ...plan.settlements.map(s => s.from),
      ...plan.settlements.map(s => s.to),
    ]);

    return {
      totalTransactions: plan.settlements.length,
      totalAmount: currencyManager.formatAmount(plan.totalAmount, plan.currency),
      participantsCount: participantIds.size,
      readyToExecute: plan.canExecute,
      issues,
    };
  }

  /**
   * Validate wallet addresses in settlement plan
   */
  validateSettlementPlan(plan: SettlementPlan): boolean {
    return plan.settlements.every(settlement => {
      return (
        tonConnectManager.isValidTonAddress(settlement.from) &&
        tonConnectManager.isValidTonAddress(settlement.to) &&
        settlement.amountTon > 0 &&
        settlement.amountFiat > 0
      );
    });
  }

  /**
   * Estimate total transaction fees (placeholder - would need real TON network data)
   */
  async estimateTransactionFees(plan: SettlementPlan): Promise<number> {
    // Rough estimate: ~0.01 TON per transaction
    const feePerTransaction = 0.01;
    const totalFeesTon = plan.settlements.length * feePerTransaction;
    
    try {
      return await currencyManager.convertFromTon(totalFeesTon, plan.currency);
    } catch (error) {
      console.warn('Failed to estimate transaction fees:', error);
      return plan.settlements.length * 0.02; // Fallback estimate in USD
    }
  }
}

export const settlementManager = SettlementManager.getInstance(); 