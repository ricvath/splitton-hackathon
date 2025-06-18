import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Users, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

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
    }
  };

  const handleSelectExisting = (participantName: string) => {
    // Store in cookie
    document.cookie = `participant_${eventId}=${participantName}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
    onParticipantSelected(participantName);
  };

  const handleCreateNew = async () => {
    if (!newParticipantName.trim()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('participants')
        .insert({
          event_id: eventId,
          name: newParticipantName.trim()
        });

      if (error) {
        console.error('Error creating participant:', error);
        return;
      }

      // Store in cookie
      document.cookie = `participant_${eventId}=${newParticipantName.trim()}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
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
              variant="rounded"
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
