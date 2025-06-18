import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Users } from 'lucide-react';
// Removed Supabase import - now using Web3 storage

interface JoinEventProps {
  eventId: string;
  onJoined: (participantName: string) => void;
}

const JoinEvent: React.FC<JoinEventProps> = ({ eventId, onJoined }) => {
  const [eventName, setEventName] = useState('');
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [eventNotFound, setEventNotFound] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('name, image_url')
        .eq('id', eventId)
        .single();

      if (error || !data) {
        setEventNotFound(true);
        return;
      }

      setEventName(data.name);
      setEventImage(data.image_url);
    } catch (error) {
      console.error('Error fetching event:', error);
      setEventNotFound(true);
    }
  };

  const handleJoin = async () => {
    if (!participantName.trim()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('participants')
        .insert({
          event_id: eventId,
          name: participantName.trim()
        });

      if (error) {
        console.error('Error joining event:', error);
        return;
      }

      onJoined(participantName.trim());
    } catch (error) {
      console.error('Error joining event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (eventNotFound) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-black">
            EVENT NOT FOUND
          </h1>
          <p className="text-gray-600 mb-8">
            This event doesn't exist or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-black tracking-tight">
            Join Event
          </h1>
          <div className="w-12 h-0.5 bg-black"></div>
          
          {eventImage && (
            <div className="mb-6">
              <img 
                src={eventImage} 
                alt={eventName}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          
          <h2 className="text-xl font-bold text-black mb-2">
            {eventName}
          </h2>
          <p className="text-gray-600 font-medium">
            Enter your name to join this event
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Your name
            </label>
            <Input 
              value={participantName} 
              onChange={(e) => setParticipantName(e.target.value)} 
              placeholder="e.g., Vicky" 
              className="w-full h-12 border-2 border-gray-300 focus:border-black font-medium"
              variant="rounded"
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <Button 
            onClick={handleJoin} 
            disabled={!participantName.trim() || isLoading} 
            size="xl"
            variant="primary"
            fullWidth
          >
            <Users />
            {isLoading ? 'Joining...' : 'Join Event'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinEvent;
