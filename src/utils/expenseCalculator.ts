
interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  sharedBy: string[];
  date: Date;
}

export const calculateBalances = (expenses: Expense[], participants: string[]): Record<string, number> => {
  const balances: Record<string, number> = {};
  
  // Initialize all participants with 0 balance
  participants.forEach(participant => {
    balances[participant] = 0;
  });
  
  expenses.forEach(expense => {
    const sharePerPerson = expense.amount / expense.sharedBy.length;
    
    // The person who paid gets credited
    balances[expense.paidBy] += expense.amount;
    
    // Everyone who shares the expense gets debited
    expense.sharedBy.forEach(participant => {
      balances[participant] -= sharePerPerson;
    });
  });
  
  return balances;
};

export const generateEventId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const getSimplifiedDebts = (balances: Record<string, number>): Array<{from: string, to: string, amount: number}> => {
  const debts: Array<{from: string, to: string, amount: number}> = [];
  
  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0.01)
    .map(([person, balance]) => ({ person, balance }))
    .sort((a, b) => b.balance - a.balance);
    
  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < -0.01)
    .map(([person, balance]) => ({ person, balance: Math.abs(balance) }))
    .sort((a, b) => b.balance - a.balance);
  
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
