import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateBalances } from '@/utils/expenseCalculator';
import { cloudStorage } from '@/storage/cloudStorage';
import { localDB } from '@/storage/indexedDB';
import { CloudEvent, CloudExpense, CloudParticipant } from '@/storage/types';
import { useTelegramData } from '@/hooks/useTelegramData';
import CoverPhoto from './CoverPhoto';
import Weather from './Weather';
import ParticipantChips from './ParticipantChips';
import PersonalizedSummary from './PersonalizedSummary';
import ExpenseForm from './ExpenseForm';
import ExpensesList from './ExpensesList';
import SettlementsSection from './SettlementsSection';
import InviteSection from './InviteSection';

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  sharedBy: string[];
  date: Date;
}

interface Participant {
  id: string;
  name: string;
}

interface EventData {
  name: string;
  image_url?: string | null;
}

interface EventManagerProps {
  eventId: string;
  currentParticipant: string;
}

const EventManager: React.FC<EventManagerProps> = ({ eventId, currentParticipant }) => {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    sharedBy: [] as string[]
  });
  const { user, shareEvent } = useTelegramData();

  useEffect(() => {
    fetchAllData();

    // Set up periodic refresh instead of real-time subscriptions
    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [eventId]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchEventData(),
      fetchParticipants(),
      fetchExpenses()
    ]);
    setIsLoading(false);
  };

  const fetchEventData = async () => {
    try {
      let event: CloudEvent | null = null;
      
      try {
        event = await cloudStorage.getEvent(eventId);
      } catch (error) {
        console.warn('Cloud storage unavailable, trying IndexedDB:', error);
        event = await localDB.getEvent(eventId);
      }

      if (event) {
        setEventData({
          name: event.name,
          image_url: event.imageUrl,
        });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      let event: CloudEvent | null = null;
      
      try {
        event = await cloudStorage.getEvent(eventId);
      } catch (error) {
        event = await localDB.getEvent(eventId);
      }

      if (event) {
        const activeParticipants = event.participants
          .filter(p => p.isActive)
          .map(p => ({
            id: p.telegramId,
            name: p.firstName + (p.lastName ? ` ${p.lastName}` : ''),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setParticipants(activeParticipants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      let event: CloudEvent | null = null;
      
      try {
        event = await cloudStorage.getEvent(eventId);
      } catch (error) {
        event = await localDB.getEvent(eventId);
      }

      if (event) {
        const formattedExpenses: Expense[] = event.expenses
          .map(expense => ({
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            paidBy: expense.paidBy,
            sharedBy: expense.sharedBy,
            date: new Date(expense.createdAt)
          }))
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        setExpenses(formattedExpenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const addExpense = async () => {
    if (newExpense.description && newExpense.amount && newExpense.paidBy && newExpense.sharedBy.length > 0) {
      try {
        // Get current event data
        let event: CloudEvent | null = null;
        
        try {
          event = await cloudStorage.getEvent(eventId);
        } catch (error) {
          event = await localDB.getEvent(eventId);
        }

        if (!event) {
          console.error('Event not found');
          return;
        }

        // Create new expense
        const newCloudExpense: CloudExpense = {
          id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          currency: event.currency,
          paidBy: newExpense.paidBy,
          sharedBy: newExpense.sharedBy,
          createdAt: Date.now(),
          lastModified: Date.now(),
        };

        // Add expense to event
        const updatedEvent: CloudEvent = {
          ...event,
          expenses: [...event.expenses, newCloudExpense],
          lastModified: Date.now(),
        };

        // Save updated event
        try {
          await cloudStorage.saveEvent(updatedEvent);
        } catch (error) {
          console.warn('Cloud storage failed, saving to IndexedDB:', error);
        }
        await localDB.saveEvent(updatedEvent);

        // Reset form and refresh data
        setNewExpense({
          description: '',
          amount: '',
          paidBy: '',
          sharedBy: []
        });
        setShowAddExpense(false);
        await fetchExpenses();
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    }
  };

  const updateExpense = async () => {
    if (!editingExpense || !newExpense.description || !newExpense.amount || !newExpense.paidBy || newExpense.sharedBy.length === 0) {
      return;
    }

    try {
      // Get current event data
      let event: CloudEvent | null = null;
      
      try {
        event = await cloudStorage.getEvent(eventId);
      } catch (error) {
        event = await localDB.getEvent(eventId);
      }

      if (!event) {
        console.error('Event not found');
        return;
      }

      // Update expense in the array
      const updatedExpenses = event.expenses.map(expense => 
        expense.id === editingExpense.id 
          ? {
              ...expense,
              description: newExpense.description,
              amount: parseFloat(newExpense.amount),
              paidBy: newExpense.paidBy,
              sharedBy: newExpense.sharedBy,
              lastModified: Date.now(),
            }
          : expense
      );

      const updatedEvent: CloudEvent = {
        ...event,
        expenses: updatedExpenses,
        lastModified: Date.now(),
      };

      // Save updated event
      try {
        await cloudStorage.saveEvent(updatedEvent);
      } catch (error) {
        console.warn('Cloud storage failed, saving to IndexedDB:', error);
      }
      await localDB.saveEvent(updatedEvent);

      // Reset form and refresh data
      setEditingExpense(null);
      setNewExpense({
        description: '',
        amount: '',
        paidBy: '',
        sharedBy: []
      });
      setShowAddExpense(false);
      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      // Get current event data
      let event: CloudEvent | null = null;
      
      try {
        event = await cloudStorage.getEvent(eventId);
      } catch (error) {
        event = await localDB.getEvent(eventId);
      }

      if (!event) {
        console.error('Event not found');
        return;
      }

      // Remove expense from the array
      const updatedExpenses = event.expenses.filter(expense => expense.id !== expenseId);

      const updatedEvent: CloudEvent = {
        ...event,
        expenses: updatedExpenses,
        lastModified: Date.now(),
      };

      // Save updated event
      try {
        await cloudStorage.saveEvent(updatedEvent);
      } catch (error) {
        console.warn('Cloud storage failed, saving to IndexedDB:', error);
      }
      await localDB.saveEvent(updatedEvent);

      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const copyInviteUrl = async () => {
    if (!eventData) return;
    
    try {
      // Use Telegram sharing if available
      if (shareEvent) {
        shareEvent(eventId, eventData.name);
      } else {
        // Fallback to copying URL
        const inviteUrl = `${window.location.origin}?event=${eventId}`;
        await navigator.clipboard.writeText(inviteUrl);
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const toggleParticipant = (participantName: string) => {
    setNewExpense(prev => ({
      ...prev,
      sharedBy: prev.sharedBy.includes(participantName)
        ? prev.sharedBy.filter(name => name !== participantName)
        : [...prev.sharedBy, participantName]
    }));
  };

  const handleShowAddExpense = () => {
    setEditingExpense(null);
    setNewExpense({
      description: '',
      amount: '',
      paidBy: currentParticipant,
      sharedBy: []
    });
    setShowAddExpense(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      paidBy: expense.paidBy,
      sharedBy: expense.sharedBy
    });
    setShowAddExpense(true);
  };

  const handleCloseExpenseForm = () => {
    setShowAddExpense(false);
    setEditingExpense(null);
    setNewExpense({
      description: '',
      amount: '',
      paidBy: '',
      sharedBy: []
    });
  };

  const handleImageUpdate = (newImageUrl: string) => {
    if (eventData) {
      setEventData({
        ...eventData,
        image_url: newImageUrl
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  const balances = calculateBalances(expenses, participants.map(p => p.name));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-4">
        <CoverPhoto 
          eventId={eventId}
          eventName={eventData.name}
          imageUrl={eventData.image_url}
          onImageUpdate={handleImageUpdate}
        />

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-black tracking-tight">
              {eventData.name}
            </h1>
            <ParticipantChips participants={participants.map(p => p.name)} />
          </div>
          <Weather eventName={eventData.name} />
        </div>

        <PersonalizedSummary 
          currentParticipant={currentParticipant}
          balances={balances}
        />

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="invite">Invite</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <ExpensesList 
              expenses={expenses}
              onEditExpense={handleEditExpense}
              onDeleteExpense={deleteExpense}
              onAddExpense={handleShowAddExpense}
            />
          </TabsContent>

          <TabsContent value="balances">
            <SettlementsSection balances={balances} />
          </TabsContent>

          <TabsContent value="invite">
            <InviteSection 
              eventId={eventId}
              eventName={eventData.name}
              onCopyInviteUrl={copyInviteUrl}
            />
          </TabsContent>
        </Tabs>

        {showAddExpense && (
          <ExpenseForm
            expense={newExpense}
            participants={participants.map(p => p.name)}
            onExpenseChange={setNewExpense}
            onToggleParticipant={toggleParticipant}
            onSave={editingExpense ? updateExpense : addExpense}
            onCancel={handleCloseExpenseForm}
            isEditing={!!editingExpense}
          />
        )}
      </div>
    </div>
  );
};

export default EventManager;
