import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateBalances } from '@/utils/expenseCalculator';
import { supabase } from '@/integrations/supabase/client';
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

  useEffect(() => {
    fetchEventData();
    fetchParticipants();
    fetchExpenses();

    // Set up real-time subscription for participants
    const participantsChannel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('Participants change detected:', payload);
          fetchParticipants();
        }
      )
      .subscribe();

    // Set up real-time subscription for expenses - all events
    const expensesChannel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log(`Expenses ${payload.eventType} detected:`, payload);
          
          // Make sure to refresh expenses for all event types (INSERT, UPDATE, DELETE)
          if (payload.eventType === 'DELETE') {
            console.log('DELETE operation detected, refreshing expenses');
          }
          
          fetchExpenses();
        }
      )
      .subscribe();

    // Set up specific subscription for delete events to ensure they're captured
    const expensesDeleteChannel = supabase
      .channel('expenses-delete-changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'expenses',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('DELETE specific channel triggered:', payload);
          fetchExpenses();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(expensesDeleteChannel);
    };
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('name, image_url')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return;
      }

      setEventData(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('id, name')
        .eq('event_id', eventId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        return;
      }

      const formattedExpenses: Expense[] = (data || []).map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        paidBy: expense.paid_by,
        sharedBy: expense.shared_by,
        date: new Date(expense.created_at)
      }));

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const addExpense = async () => {
    if (newExpense.description && newExpense.amount && newExpense.paidBy && newExpense.sharedBy.length > 0) {
      try {
        const { error } = await supabase
          .from('expenses')
          .insert({
            event_id: eventId,
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            paid_by: newExpense.paidBy,
            shared_by: newExpense.sharedBy
          });

        if (error) {
          console.error('Error adding expense:', error);
          return;
        }

        setNewExpense({
          description: '',
          amount: '',
          paidBy: '',
          sharedBy: []
        });
        setShowAddExpense(false);
        fetchExpenses();
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    }
  };

  const updateExpense = async () => {
    if (editingExpense && newExpense.description && newExpense.amount && newExpense.paidBy && newExpense.sharedBy.length > 0) {
      try {
        const { error } = await supabase
          .from('expenses')
          .update({
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            paid_by: newExpense.paidBy,
            shared_by: newExpense.sharedBy
          })
          .eq('id', editingExpense.id);

        if (error) {
          console.error('Error updating expense:', error);
          return;
        }

        setNewExpense({
          description: '',
          amount: '',
          paidBy: '',
          sharedBy: []
        });
        setEditingExpense(null);
        setShowAddExpense(false);
        fetchExpenses();
      } catch (error) {
        console.error('Error updating expense:', error);
      }
    }
  };

  const deleteExpense = async () => {
    if (editingExpense) {
      try {
        // First update the local state optimistically for immediate UI feedback
        const updatedExpenses = expenses.filter(expense => expense.id !== editingExpense.id);
        setExpenses(updatedExpenses);
        
        // Close the form immediately for better UX
        setEditingExpense(null);
        setShowAddExpense(false);
        
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', editingExpense.id);

        if (error) {
          console.error('Error deleting expense:', error);
          // If there's an error, fetch expenses again to restore correct state
          fetchExpenses();
          return;
        }

        setNewExpense({
          description: '',
          amount: '',
          paidBy: '',
          sharedBy: []
        });
        
        // Fetch expenses again to ensure consistency
        fetchExpenses();
        console.log('Expense deleted successfully:', editingExpense.id);
      } catch (error) {
        console.error('Error deleting expense:', error);
        // If there's an exception, fetch expenses again to restore correct state
        fetchExpenses();
      }
    }
  };

  const copyInviteUrl = async () => {
    try {
      const inviteUrl = `${window.location.origin}?event=${eventId}`;
      await navigator.clipboard.writeText(inviteUrl);
      // We'll handle the UI feedback in the InviteSection component
    } catch (error) {
      console.error("Failed to copy link:", error);
      // Fallback method for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      const inviteUrl = `${window.location.origin}?event=${eventId}`;
      textarea.value = inviteUrl;
      textarea.style.position = 'fixed'; // Prevent scrolling to bottom
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        document.execCommand('copy');
        // UI feedback will be handled in the InviteSection component
      } catch (err) {
        console.error('Fallback copy failed:', err);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const toggleParticipant = (participantName: string) => {
    setNewExpense(prev => ({
      ...prev,
      sharedBy: prev.sharedBy.includes(participantName)
        ? prev.sharedBy.filter(p => p !== participantName)
        : [...prev.sharedBy, participantName]
    }));
  };

  const handleShowAddExpense = () => {
    const participantNames = participants.map(p => p.name);
    setNewExpense({
      description: '',
      amount: '',
      paidBy: currentParticipant,
      sharedBy: participantNames
    });
    setEditingExpense(null);
    setShowAddExpense(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setNewExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      paidBy: expense.paidBy,
      sharedBy: expense.sharedBy
    });
    setEditingExpense(expense);
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

  const participantNames = participants.map(p => p.name);
  const balances = calculateBalances(expenses, participantNames);

  const handleImageUpdate = (newImageUrl: string) => {
    setEventData(prev => prev ? { ...prev, image_url: newImageUrl } : null);
  };

  if (isLoading || !eventData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black font-medium">LOADING...</div>
      </div>
    );
  }

  const currentBalance = balances[currentParticipant] || 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-4 mx-auto sm:max-w-md">
        <CoverPhoto 
          eventId={eventId}
          eventName={eventData.name}
          imageUrl={eventData.image_url}
          onImageUpdate={handleImageUpdate}
        />
        
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-black tracking-tight mb-1 break-words">
                {eventData.name}
              </h1>
              <div className="leading-[130%]">
                <ParticipantChips 
                  participants={participants}
                  currentParticipant={currentParticipant}
                />
              </div>
            </div>
            <div className="ml-2 flex-shrink-0">
              <Weather eventName={eventData.name} />
            </div>
          </div>
        </div>

        <PersonalizedSummary
          currentParticipant={currentParticipant}
          participantCount={participants.length}
          balance={currentBalance}
          eventId={eventId}
          onCopyInvite={copyInviteUrl}
        />

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-2">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="settlements">Settle</TabsTrigger>
            <TabsTrigger value="invite">Buddies</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 pt-2">
            <ExpensesList 
              expenses={expenses}
              participantCount={participants.length}
              onAddExpense={handleShowAddExpense}
              onEditExpense={handleEditExpense}
              currentParticipant={currentParticipant}
            />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4 pt-2">
            <SettlementsSection 
              participants={participants}
              balances={balances}
              currentParticipant={currentParticipant}
            />
          </TabsContent>

          <TabsContent value="invite" className="space-y-4 pt-2">
            <InviteSection 
              eventId={eventId}
              participants={participants}
              currentParticipant={currentParticipant}
              onCopyInvite={copyInviteUrl}
            />
          </TabsContent>
        </Tabs>

        <ExpenseForm 
          isOpen={showAddExpense}
          onClose={handleCloseExpenseForm}
          onAdd={addExpense}
          onUpdate={updateExpense}
          onDelete={deleteExpense}
          newExpense={newExpense}
          onExpenseChange={setNewExpense}
          participants={participants}
          onToggleParticipant={toggleParticipant}
          isEditMode={editingExpense !== null}
        />
      </div>
    </div>
  );
};

export default EventManager;
