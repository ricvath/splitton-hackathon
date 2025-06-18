import React from 'react';
import CoinIcon from './CoinIcon';

interface Participant {
  id: string;
  name: string;
}

interface BalancesListProps {
  participants: Participant[];
  balances: Record<string, number>;
  currentParticipant: string;
}

const BalancesList: React.FC<BalancesListProps> = ({
  participants,
  balances,
  currentParticipant
}) => {
  // Sort participants to put current user first, then by balance amount
  const sortedParticipants = [...participants].sort((a, b) => {
    // Current user always comes first
    if (a.name === currentParticipant) return -1;
    if (b.name === currentParticipant) return 1;
    
    // Otherwise sort by balance amount (highest positive to lowest negative)
    const balanceA = balances[a.name] || 0;
    const balanceB = balances[b.name] || 0;
    return balanceB - balanceA;
  });

  return (
    <div className="space-y-2">
      <h4 className="font-bold text-black">Balances</h4>
      {sortedParticipants.map(participant => {
        const balance = balances[participant.name] || 0;
        const isCurrentUser = participant.name === currentParticipant;
        
        return (
          <div 
            key={participant.id} 
            className={`flex justify-between items-center py-2 border-b-2 ${
              isCurrentUser ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}
          >
            <span className={`font-medium ${isCurrentUser ? 'text-black' : 'text-gray-700'}`}>
              {isCurrentUser ? 'You' : participant.name}
            </span>
            <span className={`font-medium flex items-center ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {balance > 0 ? (
                <>
                  +<CoinIcon size={16} className="mx-1" />{balance.toFixed(2)}
                </>
              ) : balance < 0 ? (
                <>
                  -<CoinIcon size={16} className="mx-1" />{Math.abs(balance).toFixed(2)}
                </>
              ) : (
                <>
                  <CoinIcon size={16} className="mr-1" />0.00
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BalancesList;
