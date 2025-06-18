import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Receipt, Zap, Trash2 } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useLocalExpenses, SimpleExpense } from '@/hooks/useLocalExpenses';
import { SettlementSuggestion } from './SettlementSuggestion';

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
  const { user, shareApp, hapticFeedback, isInTelegram } = useTelegram();
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

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    sharedBy: [] as string[]
  });

  const [newParticipant, setNewParticipant] = useState('');

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

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paidBy) {
      return;
    }

    const selectedParticipants = newExpense.sharedBy.length > 0 
      ? newExpense.sharedBy 
      : participants;

    addExpense({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      paidBy: newExpense.paidBy,
      sharedBy: selectedParticipants
    });

    setNewExpense({
      description: '',
      amount: '',
      paidBy: '',
      sharedBy: []
    });

    hapticFeedback('success');
  };

  const handleAddParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      addParticipant(newParticipant.trim());
      setNewParticipant('');
      hapticFeedback('light');
    }
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    hapticFeedback('medium');
  };

  const toggleParticipantSelection = (participant: string) => {
    setNewExpense(prev => ({
      ...prev,
      sharedBy: prev.sharedBy.includes(participant)
        ? prev.sharedBy.filter(p => p !== participant)
        : [...prev.sharedBy, participant]
    }));
  };

  const balances = calculateBalances();
  const debts = calculateDebts();
  const totalExpenses = getTotalExpenses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 bg-blue-600 rounded-full">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SplitTON
            </h1>
          </div>
          <p className="text-gray-600 text-sm">
            Web2 expenses, Web3 settlements
          </p>
          {isInTelegram && user && (
            <Badge variant="secondary" className="text-xs">
              Welcome, {user.first_name}! 👋
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        {expenses.length > 0 && (
          <Card className="bg-white/50 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${totalExpenses.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {expenses.length}
                  </div>
                  <div className="text-xs text-gray-600">Expenses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {participants.length}
                  </div>
                  <div className="text-xs text-gray-600">People</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses" className="text-xs">
              <Receipt className="h-4 w-4 mr-1" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="balances" className="text-xs">
              <Users className="h-4 w-4 mr-1" />
              Balances
            </TabsTrigger>
            <TabsTrigger value="settle" className="text-xs">
              <Zap className="h-4 w-4 mr-1" />
              Settle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            {/* Add Expense */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Expense</CardTitle>
                <CardDescription>Track what you and your friends spent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Dinner at restaurant"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid by</Label>
                    <select
                      id="paidBy"
                      className="w-full p-2 border rounded-md text-sm"
                      value={newExpense.paidBy}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, paidBy: e.target.value }))}
                    >
                      <option value="">Select person</option>
                      {participants.map(participant => (
                        <option key={participant} value={participant}>{participant}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {participants.length > 0 && (
                  <div className="space-y-2">
                    <Label>Split between</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {participants.map(participant => (
                        <button
                          key={participant}
                          type="button"
                          onClick={() => toggleParticipantSelection(participant)}
                          className={`p-2 text-xs rounded-md border transition-colors ${
                            newExpense.sharedBy.includes(participant) || newExpense.sharedBy.length === 0
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          {participant}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {newExpense.sharedBy.length === 0 ? 'All participants selected' : `${newExpense.sharedBy.length} selected`}
                    </p>
                  </div>
                )}

                <Button onClick={handleAddExpense} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>

            {/* Expense List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No expenses yet. Add one above! 👆
                  </p>
                ) : (
                  <div className="space-y-3">
                    {expenses.slice().reverse().map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{expense.description}</div>
                          <div className="text-xs text-gray-600">
                            Paid by <span className="font-medium">{expense.paidBy}</span> • 
                            Split {expense.sharedBy.length} ways
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-bold">${expense.amount.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              ${(expense.amount / expense.sharedBy.length).toFixed(2)} each
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Participant */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter name"
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
                  />
                  <Button onClick={handleAddParticipant}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {participants.map(participant => (
                    <Badge key={participant} variant="secondary">
                      {participant}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Balances</CardTitle>
                <CardDescription>Who owes what to whom</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(balances).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No balances to show yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(balances).map(([participant, balance]) => (
                      <div key={participant} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="font-medium">{participant}</div>
                        <div className={`font-bold ${
                          balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {balance > 0 ? '+' : ''}${balance.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settle">
            <SettlementSuggestion 
              debts={debts}
              totalExpenses={totalExpenses}
              participantCount={participants.length}
            />
          </TabsContent>
        </Tabs>

        {/* Debug/Reset */}
        {expenses.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllData}
                className="text-red-600 border-red-200 hover:bg-red-100"
              >
                Reset Demo Data
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}; 