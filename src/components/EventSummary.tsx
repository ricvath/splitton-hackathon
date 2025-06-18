import React from 'react';
import { getSimplifiedDebts } from '@/utils/expenseCalculator';

interface EventSummaryProps {
  balances: Record<string, number>;
}

const EventSummary: React.FC<EventSummaryProps> = ({ balances }) => {
  const debts = getSimplifiedDebts(balances);
  
  if (debts.length === 0) {
    return (
      <div className="p-4 bg-green-50 border-2 border-green-200 mb-6 rounded-2xl">
        <div className="text-center text-green-800 font-bold">
          Everyone is settled up!
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4 text-black">Settlement</h3>
      <div className="space-y-2">
        {debts.map((debt, index) => (
          <div key={index} className="p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl">
            <span className="font-medium text-black">
              {debt.from} owes {debt.to} ${debt.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventSummary;
