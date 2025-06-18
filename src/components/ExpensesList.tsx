import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CoinIcon from './CoinIcon';

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  sharedBy: string[];
  date: Date;
}

interface ExpensesListProps {
  expenses: Expense[];
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense
}) => {
  // Helper function to format the split description
  const formatSplitDescription = (expense: Expense) => {
    const paidByText = `${expense.paidBy} paid`;
    
    // Format the split description based on who's sharing
    if (expense.sharedBy.length === 1) {
      return `${paidByText}, covered by ${expense.sharedBy[0]} only`;
    } else {
      return `${paidByText}, split among ${expense.sharedBy.length} people`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-black">Expenses</h3>
        <Button
          onClick={onAddExpense}
          size="icon"
          variant="primary"
        >
          <Plus />
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500 font-medium">
          No expenses yet. Add one to get started!
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(expense => (
            <div
              key={expense.id}
              onClick={() => onEditExpense(expense)}
              className="px-6 py-4 border-2 border-gray-200 cursor-pointer hover:border-black transition-colors rounded-2xl"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-black">{expense.description}</span>
                <span className="font-bold text-black flex items-center">
                  <CoinIcon size={18} className="mr-1" /> 
                  {expense.amount.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {formatSplitDescription(expense)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpensesList;
