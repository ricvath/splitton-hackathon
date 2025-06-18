import React from 'react';
import { Button } from '@/components/ui/button';
import { getSimplifiedDebts } from '@/utils/expenseCalculator';
import BalancesList from './BalancesList';
import CoinIcon from './CoinIcon';

interface Participant {
  id: string;
  name: string;
}

interface SettlementsSectionProps {
  participants: Participant[];
  balances: Record<string, number>;
  currentParticipant: string;
}

const SettlementsSection: React.FC<SettlementsSectionProps> = ({
  participants,
  balances,
  currentParticipant
}) => {
  const debts = getSimplifiedDebts(balances);
  
  // Sort debts to prioritize the current user's debts
  const sortedDebts = [...debts].sort((a, b) => {
    // If current user is involved in debt a but not b, a comes first
    const aHasCurrentUser = a.from === currentParticipant || a.to === currentParticipant;
    const bHasCurrentUser = b.from === currentParticipant || b.to === currentParticipant;
    
    if (aHasCurrentUser && !bHasCurrentUser) return -1;
    if (!aHasCurrentUser && bHasCurrentUser) return 1;
    
    // If current user is the debtor in both, sort by amount
    if (a.from === currentParticipant && b.from === currentParticipant) {
      return b.amount - a.amount; // Higher amounts first
    }
    
    // If current user is the creditor in both, sort by amount
    if (a.to === currentParticipant && b.to === currentParticipant) {
      return b.amount - a.amount; // Higher amounts first
    }
    
    // If current user is debtor in one and creditor in another, debtor comes first
    if (a.from === currentParticipant && b.to === currentParticipant) return -1;
    if (a.to === currentParticipant && b.from === currentParticipant) return 1;
    
    // Default sort by amount
    return b.amount - a.amount;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-black">Settlement</h3>
      </div>

      {sortedDebts.length === 0 ? (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
          <div className="text-center text-green-800 font-bold">
            Everyone is settled up!
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedDebts.map((debt, index) => (
            <div 
              key={index} 
              className={`p-3 border-2 rounded-2xl ${
                debt.from === currentParticipant || debt.to === currentParticipant
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span className="font-medium text-black flex items-center">
                <span>
                  {debt.from === currentParticipant ? 'You' : debt.from} owe{debt.from === currentParticipant ? '' : 's'} {debt.to === currentParticipant ? 'you' : debt.to}
                </span>
                <CoinIcon size={16} className="mx-1" />
                <span>{debt.amount.toFixed(2)}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <BalancesList 
        participants={participants}
        balances={balances}
        currentParticipant={currentParticipant}
      />
    </div>
  );
};

export default SettlementsSection;
