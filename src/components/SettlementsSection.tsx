import React from 'react';
import { Button } from '@/components/ui/button';
import { getSimplifiedDebts } from '@/utils/expenseCalculator';
import CoinIcon from './CoinIcon';

interface Balance {
  participant: string;
  balance: number;
}

interface SettlementsSectionProps {
  balances: Balance[];
}

const SettlementsSection: React.FC<SettlementsSectionProps> = ({
  balances
}) => {
  // Convert balances array to the format expected by getSimplifiedDebts
  const balancesRecord: Record<string, number> = {};
  balances.forEach(b => {
    balancesRecord[b.participant] = b.balance;
  });

  const debts = getSimplifiedDebts(balancesRecord);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-black">Settlement</h3>
      </div>

      {debts.length === 0 ? (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
          <div className="text-center text-green-800 font-bold">
            Everyone is settled up!
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {debts.map((debt, index) => (
            <div 
              key={index} 
              className="p-3 border-2 rounded-2xl bg-gray-50 border-gray-200"
            >
              <span className="font-medium text-black flex items-center">
                <span>
                  {debt.from} owes {debt.to}
                </span>
                <CoinIcon size={16} className="mx-1" />
                <span>{debt.amount.toFixed(2)}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-bold text-black">Balances</h4>
        {balances.map(balance => (
          <div 
            key={balance.participant} 
            className="flex justify-between items-center py-2 border-b-2 border-gray-200"
          >
            <span className="font-medium text-gray-700">
              {balance.participant}
            </span>
            <span className={`font-medium flex items-center ${
              balance.balance > 0 ? 'text-green-600' : 
              balance.balance < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {balance.balance > 0 ? (
                <>
                  +<CoinIcon size={16} className="mx-1" />{balance.balance.toFixed(2)}
                </>
              ) : balance.balance < 0 ? (
                <>
                  -<CoinIcon size={16} className="mx-1" />{Math.abs(balance.balance).toFixed(2)}
                </>
              ) : (
                <>
                  <CoinIcon size={16} className="mr-1" />0.00
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettlementsSection;
