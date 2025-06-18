import { useEffect, useState } from 'react';

export interface SimpleExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  sharedBy: string[];
  timestamp: number;
  category?: string;
}

export interface BalanceResult {
  [participant: string]: number;
}

export interface DebtResult {
  from: string;
  to: string;
  amount: number;
}

export const useLocalExpenses = () => {
  const [expenses, setExpenses] = useState<SimpleExpense[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('splitton-expenses');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    }
    
    const savedParticipants = localStorage.getItem('splitton-participants');
    if (savedParticipants) {
      try {
        setParticipants(JSON.parse(savedParticipants));
      } catch (error) {
        console.error('Error loading participants:', error);
      }
    }
  }, []);

  // Save to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('splitton-expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Save to localStorage whenever participants change
  useEffect(() => {
    localStorage.setItem('splitton-participants', JSON.stringify(participants));
  }, [participants]);

  const addExpense = (expense: Omit<SimpleExpense, 'id' | 'timestamp'>) => {
    const newExpense: SimpleExpense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    
    setExpenses(prev => [...prev, newExpense]);
    
    // Auto-add participants if they don't exist
    const allParticipants = new Set([...participants, expense.paidBy, ...expense.sharedBy]);
    setParticipants(Array.from(allParticipants));
  };

  const updateExpense = (id: string, updates: Partial<SimpleExpense>) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const addParticipant = (name: string) => {
    if (!participants.includes(name)) {
      setParticipants(prev => [...prev, name]);
    }
  };

  const removeParticipant = (name: string) => {
    // Check if participant is used in any expenses
    const isUsed = expenses.some(expense => 
      expense.paidBy === name || expense.sharedBy.includes(name)
    );
    
    if (!isUsed) {
      setParticipants(prev => prev.filter(p => p !== name));
    }
  };

  // Calculate balances
  const calculateBalances = (): BalanceResult => {
    const balances: BalanceResult = {};
    
    // Initialize all participants with 0 balance
    participants.forEach(participant => {
      balances[participant] = 0;
    });

    expenses.forEach(expense => {
      const { amount, paidBy, sharedBy } = expense;
      const sharePerPerson = amount / sharedBy.length;

      // The person who paid gets credited
      balances[paidBy] = (balances[paidBy] || 0) + amount;

      // Everyone who shared the expense gets debited
      sharedBy.forEach(person => {
        balances[person] = (balances[person] || 0) - sharePerPerson;
      });
    });

    return balances;
  };

  // Calculate simplified debts (who owes whom)
  const calculateDebts = (): DebtResult[] => {
    const balances = calculateBalances();
    const debts: DebtResult[] = [];
    
    // Separate creditors and debtors
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0.01)
      .map(([person, balance]) => ({ person, balance }))
      .sort((a, b) => b.balance - a.balance);
    
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < -0.01)
      .map(([person, balance]) => ({ person, balance: Math.abs(balance) }))
      .sort((a, b) => b.balance - a.balance);

    // Match creditors with debtors
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const amount = Math.min(creditor.balance, debtor.balance);
      
      if (amount > 0.01) {
        debts.push({
          from: debtor.person,
          to: creditor.person,
          amount: Math.round(amount * 100) / 100
        });
      }
      
      creditor.balance -= amount;
      debtor.balance -= amount;
      
      if (creditor.balance < 0.01) i++;
      if (debtor.balance < 0.01) j++;
    }
    
    return debts;
  };

  const getTotalExpenses = (): number => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getExpensesByParticipant = (participant: string): SimpleExpense[] => {
    return expenses.filter(expense => 
      expense.paidBy === participant || expense.sharedBy.includes(participant)
    );
  };

  // Reset all data
  const clearAllData = () => {
    setExpenses([]);
    setParticipants([]);
    localStorage.removeItem('splitton-expenses');
    localStorage.removeItem('splitton-participants');
  };

  return {
    expenses,
    participants,
    addExpense,
    updateExpense,
    deleteExpense,
    addParticipant,
    removeParticipant,
    setParticipants,
    calculateBalances,
    calculateDebts,
    getTotalExpenses,
    getExpensesByParticipant,
    clearAllData,
  };
}; 