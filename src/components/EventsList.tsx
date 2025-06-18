import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Users, DollarSign, Trash2, Eye, Plus } from 'lucide-react';
import { cloudStorage } from '@/storage/cloudStorage';
import { localDB } from '@/storage/indexedDB';
import { CloudEvent } from '@/storage/types';
import { useTelegramData } from '@/hooks/useTelegramData';
import { calculateBalances } from '@/utils/expenseCalculator';

interface EventsListProps {
  onSelectEvent: (eventId: string) => void;
  onCreateEvent: () => void;
}

const EventsList: React.FC<EventsListProps> = ({ onSelectEvent, onCreateEvent }) => {
  const [events, setEvents] = useState<CloudEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const { user } = useTelegramData();

  useEffect(() => {
    if (user) {
      fetchUserEvents();
    }
  }, [user]);

  const fetchUserEvents = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let userEvents: CloudEvent[] = [];
      
      try {
        // Try cloud storage first
        userEvents = await cloudStorage.getUserEvents(user.id.toString());
      } catch (error) {
        console.warn('Cloud storage unavailable, trying IndexedDB:', error);
        // Fallback to IndexedDB
        const eventIds = await localDB.getUserEvents(user.id.toString());
        for (const eventId of eventIds) {
          try {
            const event = await localDB.getEvent(eventId);
            if (event && event.isActive) {
              userEvents.push(event);
            }
          } catch (error) {
            console.warn(`Failed to fetch event ${eventId}:`, error);
          }
        }
      }
      
      setEvents(userEvents);
    } catch (error) {
      console.error('Error fetching user events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    
    setDeletingEventId(eventId);
    try {
      await cloudStorage.deleteEvent(eventId, user.id.toString());
      
      // Remove from local state
      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      // Refresh the list to be sure
      await fetchUserEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setDeletingEventId(null);
    }
  };

  const getEventStats = (event: CloudEvent) => {
    const activeParticipants = event.participants.filter(p => p.isActive);
    const totalExpenses = event.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate if there are outstanding balances
    const participantNames = activeParticipants.map(p => p.telegramId);
    const expenses = event.expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      paidBy: expense.paidBy,
      sharedBy: expense.sharedBy,
      date: new Date(expense.createdAt)
    }));
    
    const balances = calculateBalances(expenses, participantNames);
    const hasOutstandingBalances = Object.values(balances).some(balance => Math.abs(balance) > 0.01);
    
    return {
      participantCount: activeParticipants.length,
      expenseCount: event.expenses.length,
      totalAmount: totalExpenses,
      hasOutstandingBalances,
      isCreator: event.createdBy === user?.id.toString(),
    };
  };

  const canDeleteEvent = async (eventId: string) => {
    if (!user) return false;
    
    try {
      const result = await cloudStorage.canDeleteEvent(eventId, user.id.toString());
      return result.canDelete;
    } catch (error) {
      return false;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">
              My Events
            </h1>
            <div className="w-12 h-0.5 bg-black mt-2"></div>
          </div>
          <Button onClick={onCreateEvent} size="sm" className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-6">Create your first expense splitting event</p>
            <Button onClick={onCreateEvent} className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const stats = getEventStats(event);
              
              return (
                <Card key={event.id} className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-black mb-1">
                          {event.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-500">
                          Created {formatDate(event.createdAt)}
                          {stats.isCreator && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Creator
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      {event.imageUrl && (
                        <img 
                          src={event.imageUrl} 
                          alt={event.name}
                          className="w-12 h-12 rounded-lg object-cover ml-3"
                        />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {stats.participantCount}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {stats.expenseCount} expenses
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-black">
                          ${stats.totalAmount.toFixed(2)}
                        </div>
                        {stats.hasOutstandingBalances && (
                          <Badge variant="destructive" className="text-xs">
                            Unsettled
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => onSelectEvent(event.id)}
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Event
                      </Button>
                      
                      {stats.isCreator && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              disabled={deletingEventId === event.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{event.name}"?
                                {stats.hasOutstandingBalances && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                    ⚠️ This event has outstanding balances. All expenses must be settled before deletion.
                                  </div>
                                )}
                                {!stats.hasOutstandingBalances && stats.expenseCount === 0 && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    This event has no expenses and can be safely deleted.
                                  </div>
                                )}
                                {!stats.hasOutstandingBalances && stats.expenseCount > 0 && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    All expenses in this event are settled and it can be safely deleted.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteEvent(event.id)}
                                disabled={stats.hasOutstandingBalances || deletingEventId === event.id}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deletingEventId === event.id ? 'Deleting...' : 'Delete Event'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList; 