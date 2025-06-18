import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import CoinIcon from './CoinIcon';

interface Balance {
  participant: string;
  balance: number;
}

interface PersonalizedSummaryProps {
  currentParticipant: string;
  balances: Balance[];
}

const PersonalizedSummary: React.FC<PersonalizedSummaryProps> = ({
  currentParticipant,
  balances
}) => {
  // Find the current participant's balance
  const currentBalance = balances.find(b => b.participant === currentParticipant)?.balance || 0;
  
  const getSummaryMessage = () => {
    if (currentBalance === 0) {
      return (
        <p className="text-gray-600 flex items-center">
          You're all settled up!
        </p>
      );
    } else if (currentBalance > 0) {
      return (
        <p className="text-green-600 font-medium flex items-center">
          You're owed <CoinIcon size={18} className="mx-1" /> {Math.abs(currentBalance).toFixed(2)}.
        </p>
      );
    } else {
      return (
        <p className="text-red-600 font-medium flex items-center">
          You owe <CoinIcon size={18} className="mx-1" /> {Math.abs(currentBalance).toFixed(2)}.
        </p>
      );
    }
  };

  return (
    <div className="space-y-1 mb-8">
      <h2 className="text-lg font-bold text-black">Hi {currentParticipant},</h2>
      {getSummaryMessage()}
    </div>
  );
};

export default PersonalizedSummary;
