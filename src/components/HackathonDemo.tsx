import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Users, Receipt, Zap, Trash2 } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { useLocalExpenses, SimpleExpense } from '../hooks/useLocalExpenses';
import { SettlementSuggestion } from './SettlementSuggestion';
import { Separator } from '../components/ui/separator';

const DEMO_EXPENSES: Omit<SimpleExpense, 'id' | 'timestamp'>[] = [
  {
    description: "Pizza dinner 🍕",
    amount: 42.50,
    paidBy: "You",
    sharedBy: ["You", "Alice", "Bob"],
    category: "Food"
  },
  {
    description: "Uber to airport 🚗",
    amount: 28.75,
    paidBy: "Alice",
    sharedBy: ["You", "Alice", "Bob"],
    category: "Transport"
  },
  {
    description: "Coffee & pastries ☕",
    amount: 15.60,
    paidBy: "Bob",
    sharedBy: ["You", "Alice", "Bob"],
    category: "Food"
  }
];

export const HackathonDemo = () => {
  const { user, shareApp, hapticFeedback, isInTelegram, showMainButton, hideMainButton, botName, isReady } = useTelegram();
  const {
    expenses,
    participants,
    addExpense,
    deleteExpense,
    addParticipant,
    calculateBalances,
    calculateDebts,
    getTotalExpenses,
    clearAllData
  } = useLocalExpenses();

  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [selectedPayer, setSelectedPayer] = useState<string>('');
  
  const [newParticipantName, setNewParticipantName] = useState('');

  // Initialize demo data if no expenses exist
  useEffect(() => {
    if (expenses.length === 0) {
      const currentUser = user?.first_name || "You";
      
      // Add demo participants
      const demoParticipants = [currentUser, "Alice", "Bob"];
      demoParticipants.forEach(participant => {
        addParticipant(participant);
      });

      // Add demo expenses
      DEMO_EXPENSES.forEach(expense => {
        addExpense({
          ...expense,
          paidBy: expense.paidBy === "You" ? currentUser : expense.paidBy,
          sharedBy: expense.sharedBy.map(p => p === "You" ? currentUser : p)
        });
      });
    }
  }, [user, expenses.length, addExpense, addParticipant]);

  // Set up Telegram main button when balances are available
  useEffect(() => {
    if (isInTelegram && calculateBalances() && Object.keys(calculateBalances()).length > 0) {
      showMainButton('Settle Up', () => {
        // Scroll to settlement section
        const settlementSection = document.getElementById('settlement-section');
        if (settlementSection) {
          settlementSection.scrollIntoView({ behavior: 'smooth' });
          hapticFeedback('light');
        }
      });
    } else {
      hideMainButton();
    }
  }, [isInTelegram, calculateBalances, showMainButton, hideMainButton, hapticFeedback]);

  const handleAddParticipant = () => {
    if (newParticipantName.trim()) {
      addParticipant(newParticipantName.trim());
      setNewParticipantName('');
      hapticFeedback('selection');
    }
  };

  const handleAddExpense = () => {
    if (newExpenseName.trim() && newExpenseAmount && selectedPayer) {
      addExpense({
        id: Date.now().toString(),
        name: newExpenseName.trim(),
        amount: parseFloat(newExpenseAmount),
        paidBy: selectedPayer,
        date: new Date().toISOString(),
      });
      setNewExpenseName('');
      setNewExpenseAmount('');
      hapticFeedback('success');
    }
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    hapticFeedback('medium');
  };

  const balances = calculateBalances();
  const debts = calculateDebts();
  const totalExpenses = getTotalExpenses();

  if (!isReady) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center h-screen">
        <div className="text-center">
          <img src="/coin.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p>Loading {botName}...</p>
        </div>
      </div>
    );
  }

  // Ensure balances is not null
  const safeBalances = balances || {};
  const hasBalances = Object.keys(safeBalances).length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      {/* App header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">SplitTON</h1>
          <p className="text-sm opacity-75">Web2 expenses, Web3 settlements</p>
        </div>
        <div className="flex items-center gap-2">
          <img src="/coin.gif" alt="TON Coin" className="w-10 h-10 ton-coin" />
        </div>
      </div>

      {/* User info */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Welcome{user ? `, ${user.first_name}` : ''}!</CardTitle>
          <CardDescription>
            {isInTelegram 
              ? 'You are using the Telegram Mini App version'
              : 'You are using the browser version (some features may be limited)'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Participants */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Participants</CardTitle>
          <CardDescription>Add people to split expenses with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input 
              placeholder="Name" 
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
            />
            <Button onClick={handleAddParticipant}>Add</Button>
          </div>
          
          {participants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {participants.map(participant => (
                <Badge key={participant} variant="secondary">
                  {participant}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No participants added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Add expense */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Add Expense</CardTitle>
          <CardDescription>Record who paid for what</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expense-name">Description</Label>
              <Input 
                id="expense-name"
                placeholder="e.g. Dinner, Taxi, etc." 
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="expense-amount">Amount</Label>
              <Input 
                id="expense-amount"
                type="number" 
                placeholder="0.00" 
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="payer">Paid by</Label>
              <select 
                id="payer"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedPayer}
                onChange={(e) => setSelectedPayer(e.target.value)}
                disabled={participants.length === 0}
              >
                <option value="">Select who paid</option>
                {participants.map(participant => (
                  <option key={participant} value={participant}>{participant}</option>
                ))}
              </select>
            </div>
            
            <Button 
              onClick={handleAddExpense} 
              className="w-full"
              disabled={!newExpenseName.trim() || !newExpenseAmount || !selectedPayer}
            >
              Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses list */}
      {expenses.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Expenses</CardTitle>
            <CardDescription>Total: {totalExpenses.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.map(expense => (
                <div key={expense.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-sm text-muted-foreground">Paid by {expense.paidBy}</p>
                  </div>
                  <p className="font-medium">{expense.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balances */}
      {hasBalances && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Balances</CardTitle>
            <CardDescription>Who owes what to whom</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(safeBalances).map(([person, balance]) => (
                <div key={person} className="flex justify-between items-center">
                  <p>{person}</p>
                  <p className={`font-medium ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : ''}`}>
                    {balance > 0 ? '+' : ''}{balance.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlement suggestions */}
      {expenses.length > 0 && hasBalances && (
        <>
          <Separator className="my-6" />
          <div id="settlement-section">
            <SettlementSuggestion 
              debts={debts}
              totalExpenses={totalExpenses}
              participantCount={participants.length}
            />
          </div>
        </>
      )}

      {/* Debug info */}
      <div className="mt-8 text-xs text-muted-foreground">
        <p>Running in: {isInTelegram ? 'Telegram Mini App' : 'Browser'}</p>
        <p>User: {user ? `${user.first_name} ${user.last_name || ''}` : 'Not logged in'}</p>
        <p className="mt-2">SplitTON Hackathon Demo</p>
      </div>
    </div>
  );
}; 