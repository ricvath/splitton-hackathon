import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnimatedIcons from './AnimatedIcons';

interface HomeProps {
  onCreateEvent: (eventName: string) => void;
}

const Home: React.FC<HomeProps> = ({ onCreateEvent }) => {
  const [eventName, setEventName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateEvent = async () => {
    if (!eventName.trim()) return;
    
    setIsCreating(true);
    
    try {
      onCreateEvent(eventName);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && eventName.trim()) {
      handleCreateEvent();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="p-8 w-full max-w-md text-center">
        <AnimatedIcons />
        <h1 className="text-4xl font-bold text-black mb-8 tracking-tight">
          Who paid what?
        </h1>
        <p className="text-xl font-semibold mb-8 tracking-tight">
          Easily track expensen when you're traveling with friends. No signup needed.
        </p>
        <div className="flex flex-col items-center space-y-6 w-full">
          <div className="w-full flex justify-center">
            <Input
              type="text"
              placeholder="Where are you going?"
              className="text-center"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateEvent}
            disabled={isCreating || !eventName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
