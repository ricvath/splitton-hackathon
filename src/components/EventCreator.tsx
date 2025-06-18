import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Clock } from 'lucide-react';
import { generateEventId } from '@/utils/expenseCalculator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cloudStorage } from '@/storage/cloudStorage';
import { localDB } from '@/storage/indexedDB';
import { CloudEvent } from '@/storage/types';
import { useTelegramData } from '@/hooks/useTelegramData';

interface EventCreatorProps {
  onEventCreated: (eventId: string) => void;
}

const EventCreator: React.FC<EventCreatorProps> = ({ onEventCreated }) => {
  const [eventName, setEventName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useTelegramData();

  const handleCreate = async () => {
    if (!eventName.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const eventId = generateEventId();
      
      // Create new event
      const newEvent: CloudEvent = {
        id: eventId,
        name: eventName.trim(),
        imageUrl: imageUrl.trim() || null,
        currency: 'USD',
        createdBy: user.id.toString(),
        createdAt: Date.now(),
        lastModified: Date.now(),
        participants: [{
          telegramId: user.id.toString(),
          firstName: user.firstName,
          lastName: user.lastName || '',
          username: user.username || '',
          isActive: true,
          joinedAt: Date.now(),
        }],
        expenses: [],
      };

      // Save to cloud storage (primary)
      try {
        await cloudStorage.saveEvent(newEvent);
      } catch (error) {
        console.warn('Cloud storage failed, saving to IndexedDB only:', error);
      }

      // Save to IndexedDB (fallback)
      await localDB.saveEvent(newEvent);
      
      // Update user's event list
      const userEvents = await localDB.getUserEvents(user.id.toString());
      await localDB.saveUserEvents(user.id.toString(), [...userEvents, eventId]);

      onEventCreated(eventId);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canCreate = eventName.trim() && user && !isLoading;

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-black tracking-tight">
            Create Event
          </h1>
          <div className="w-12 h-0.5 bg-black"></div>
        </div>

        <div className="space-y-6 mx-0">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Event Name
            </label>
            <Input 
              value={eventName} 
              onChange={(e) => setEventName(e.target.value)} 
              placeholder="e.g., Trip to NYC" 
              className="w-full h-12 border-2 border-gray-300 focus:border-black font-medium rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Event image (optional)
            </label>
            <Input 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
              placeholder="https://example.com/image.jpg" 
              className="w-full h-12 border-2 border-gray-300 focus:border-black font-medium rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add an image URL for your event
            </p>
          </div>

          <Alert className="bg-gray-50 border border-gray-200">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-xs text-gray-600">
              Events are stored in Telegram Cloud Storage and locally for offline access.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleCreate} 
            disabled={!canCreate} 
            size="xl"
            variant="primary"
            fullWidth
          >
            <Check className="h-5 w-5" />
            {isLoading ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventCreator;
