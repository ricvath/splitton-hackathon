import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Upload, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateEventId } from '@/utils/expenseCalculator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EventCreatorProps {
  onEventCreated: (eventId: string) => void;
}

const EventCreator: React.FC<EventCreatorProps> = ({ onEventCreated }) => {
  const [eventName, setEventName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnsplashImage = async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('unsplash-image', {
        body: { query }
      });

      if (error) {
        console.error('Error fetching Unsplash image:', error);
        return null;
      }

      return data?.imageUrl || null;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  };

  const handleCreate = async () => {
    if (!eventName.trim()) return;
    
    setIsLoading(true);
    try {
      const eventId = generateEventId();
      
      // If no image URL was manually entered, try to fetch one from Unsplash
      let finalImageUrl = imageUrl.trim();
      if (!finalImageUrl) {
        console.log('Fetching automatic image for:', eventName);
        finalImageUrl = await fetchUnsplashImage(eventName.trim()) || null;
      }
      
      const { error } = await supabase
        .from('events')
        .insert({
          id: eventId,
          name: eventName.trim(),
          image_url: finalImageUrl
        });

      if (error) {
        console.error('Error creating event:', error);
        return;
      }

      onEventCreated(eventId);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canCreate = eventName.trim() && !isLoading;

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
              className="w-full h-12 border-2 border-gray-300 focus:border-black font-medium"
              variant="rounded"
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
              className="w-full h-12 border-2 border-gray-300 focus:border-black font-medium"
              variant="rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add an image URL or leave empty for an automatic image
            </p>
          </div>

          <Alert className="bg-gray-50 border border-gray-200">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-xs text-gray-600">
              Events and all associated data are automatically deleted after 30 days of inactivity to save storage space.
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
