import { useEffect, useState } from 'react';

export interface SimpleExpense {
  id: string;
  name: string;
  amount: number;
  paidBy: string;
  date: string;
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

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedExpenses = localStorage.getItem('splitton_expenses');
      const savedParticipants = localStorage.getItem('splitton_participants');
      
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      }
      
      if (savedParticipants) {
        setParticipants(JSON.parse(savedParticipants));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('splitton_expenses', JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses to localStorage:', error);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('splitton_participants', JSON.stringify(participants));
    } catch (error) {
      console.error('Error saving participants to localStorage:', error);
    }
  }, [participants]);

  const addExpense = (expense: SimpleExpense) => {
    setExpenses(prev => [...prev, expense]);
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const addParticipant = (name: string) => {
    if (!participants.includes(name)) {
      setParticipants(prev => [...prev, name]);
    }
  };

  const removeParticipant = (name: string) => {
    setParticipants(prev => prev.filter(participant => participant !== name));
  };

  const calculateBalances = (): Record<string, number> => {
    if (!participants.length || !expenses.length) {
      return {};
    }

    try {
      const balances: Record<string, number> = {};
      
      // Initialize balances for all participants
      participants.forEach(participant => {
        balances[participant] = 0;
      });
      
      // Calculate how much each person paid and owes
      expenses.forEach(expense => {
        const { amount, paidBy } = expense;
        const perPersonAmount = amount / participants.length;
        
        // The person who paid gets credit
        balances[paidBy] += amount;
        
        // Everyone owes their share
        participants.forEach(participant => {
          balances[participant] -= perPersonAmount;
        });
      });
      
      // Round to 2 decimal places
      Object.keys(balances).forEach(person => {
        balances[person] = parseFloat(balances[person].toFixed(2));
      });
      
      return balances;
    } catch (error) {
      console.error('Error calculating balances:', error);
      return {};
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    expenses,
    participants,
    addExpense,
    removeExpense,
    addParticipant,
    removeParticipant,
    balances: calculateBalances(),
    totalExpenses
  };
}; 