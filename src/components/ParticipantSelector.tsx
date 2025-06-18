import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Users, User } from 'lucide-react';
import { cloudStorage } from '@/storage/cloudStorage';
import { localDB } from '@/storage/indexedDB';
import { CloudEvent, CloudParticipant } from '@/storage/types';
import { useTelegramData } from '@/hooks/useTelegramData';
import CoverPhoto from './CoverPhoto';
import Weather from './Weather';

interface Participant {
  id: string;
  name: string;
}

interface ParticipantSelectorProps {
  eventId: string;
  eventName: string;
  eventImageUrl?: string | null;
  onParticipantSelected: (participantName: string) => void;
  onImageUpdate: (imageUrl: string) => void;
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({ 
  eventId, 
  eventName,
  eventImageUrl,
  onParticipantSelected,
  onImageUpdate
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useTelegramData();

  useEffect(() => {
    fetchParticipants();
    
    // Pre-fill with Telegram user's first name if available
    if (user && !newParticipantName) {
      setNewParticipantName(user.firstName);
    }
  }, [eventId, user]);

  const fetchParticipants = async () => {
    try {
      // Try cloud storage first, fallback to IndexedDB
      let eventData: CloudEvent | null = null;
      
      try {
        eventData = await cloudStorage.getEvent(eventId);
      } catch (error) {
        console.warn('Cloud storage unavailable, trying IndexedDB:', error);
        eventData = await localDB.getEvent(eventId);
      }

      if (eventData) {
        const activeParticipants = eventData.participants
          .filter(p => p.isActive)
          .map(p => ({
            id: p.telegramId,
            name: p.firstName + (p.lastName ? ` ${p.lastName}` : ''),
          }));
        setParticipants(activeParticipants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleSelectExisting = (participantName: string) => {
    onParticipantSelected(participantName);
  };

  const handleCreateNew = async () => {
    if (!newParticipantName.trim()) return;
    
    setIsLoading(true);
    try {
      // Get current event data
      let eventData: CloudEvent | null = null;
      
      try {
        eventData = await cloudStorage.getEvent(eventId);
      } catch (error) {
        eventData = await localDB.getEvent(eventId);
      }

      if (!eventData) {
        console.error('Event not found');
        return;
      }

      // Create new participant
      const newParticipant: CloudParticipant = {
        telegramId: user?.id.toString() || `temp_${Date.now()}`,
        username: user?.username,
        firstName: newParticipantName.trim(),
        lastName: user?.lastName,
        walletAddress: undefined, // Will be set when user connects wallet
        joinedAt: Date.now(),
        isActive: true,
      };

      // Add participant to event
      const updatedEvent: CloudEvent = {
        ...eventData,
        participants: [...eventData.participants, newParticipant],
        lastModified: Date.now(),
      };

      // Save updated event to both storages
      try {
        await cloudStorage.saveEvent(updatedEvent);
        if (user) {
          await cloudStorage.addUserEvent(user.id.toString(), eventId);
        }
      } catch (error) {
        console.warn('Cloud storage failed, saving to IndexedDB:', error);
      }
      
      await localDB.saveEvent(updatedEvent);
      if (user) {
        const userEvents = await localDB.getUserEvents(user.id.toString());
        if (!userEvents.includes(eventId)) {
          await localDB.saveUserEvents(user.id.toString(), [...userEvents, eventId]);
        }
      }

      onParticipantSelected(newParticipantName.trim());
    } catch (error) {
      console.error('Error creating participant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <CoverPhoto 
          eventId={eventId}
          eventName={eventName}
          imageUrl={eventImageUrl}
          onImageUpdate={onImageUpdate}
        />

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-black tracking-tight">
              {eventName}
            </h1>
            <p className="text-gray-600 font-medium">
              Who are you in this event?
            </p>
          </div>
          <Weather eventName={eventName} />
        </div>

        {participants.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4 text-black">Select existing participant</h2>
            <div className="space-y-2">
              {participants.map(participant => (
                <Button
                  key={participant.id}
                  onClick={() => handleSelectExisting(participant.name)}
                  variant="outline"
                  size="lg"
                  fullWidth
                  className="justify-start"
                >
                  <User />
                  {participant.name}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center my-6">
              <div className="flex-1 h-0.5 bg-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 font-medium">or</span>
              <div className="flex-1 h-0.5 bg-gray-300"></div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold mb-4 text-black">Join the trip as</h2>
          <div className="space-y-4">
            <Input 
              value={newParticipantName} 
              onChange={(e) => setNewParticipantName(e.target.value)} 
              placeholder="Username (e.g., Vicky)" 
              className="w-full font-medium"
          
              onKeyPress={(e) => e.key === 'Enter' && handleCreateNew()}
            />

            <Button 
              onClick={handleCreateNew} 
              disabled={!newParticipantName.trim() || isLoading}
              size="xl"
              variant="primary"
              fullWidth
            >
              <Users />
              {isLoading ? 'Joining...' : 'Join event'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantSelector;
