import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Home from '@/components/Home';
import ParticipantSelector from '@/components/ParticipantSelector';
import EventManager from '@/components/EventManager';
import { supabase } from '@/integrations/supabase/client';
import { generateEventId } from '@/utils/expenseCalculator';

type AppState = 'home' | 'participant-select' | 'event';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentEventName, setCurrentEventName] = useState<string>('');
  const [currentEventImageUrl, setCurrentEventImageUrl] = useState<string | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId) {
      setCurrentEventId(eventId);
      checkEventAndParticipant(eventId);
    }
  }, [searchParams]);

  const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const checkEventAndParticipant = async (eventId: string) => {
    try {
      // First check if event exists
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('name, image_url')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        setAppState('home');
        setSearchParams({});
        return;
      }

      setCurrentEventName(eventData.name);
      setCurrentEventImageUrl(eventData.image_url);

      // Check if user has a participant cookie for this event
      const participantName = getCookieValue(`participant_${eventId}`);
      
      if (participantName) {
        // Verify the participant still exists in the database
        const { data: participantData } = await supabase
          .from('participants')
          .select('name')
          .eq('event_id', eventId)
          .eq('name', participantName)
          .single();

        if (participantData) {
          setCurrentParticipant(participantName);
          setAppState('event');
          return;
        }
      }

      // No valid participant found, show participant selector
      setAppState('participant-select');
    } catch (error) {
      console.error('Error checking event:', error);
      setAppState('home');
      setSearchParams({});
    }
  };

  const handleCreateEvent = async (eventName: string, initialImageUrl?: string) => {
    try {
      const eventId = generateEventId();
      
      const { error } = await supabase
        .from('events')
        .insert({
          id: eventId,
          name: eventName,
          image_url: initialImageUrl
        });

      if (error) {
        console.error('Error creating event:', error);
        return;
      }

      setCurrentEventId(eventId);
      setCurrentEventName(eventName);
      setCurrentEventImageUrl(initialImageUrl || null);
      setSearchParams({ event: eventId });
      setAppState('participant-select');
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleParticipantSelected = (participantName: string) => {
    setCurrentParticipant(participantName);
    setAppState('event');
  };

  const handleImageUpdate = (imageUrl: string) => {
    setCurrentEventImageUrl(imageUrl);
  };

  const handleBackToHome = () => {
    setAppState('home');
    setCurrentEventId(null);
    setCurrentEventName('');
    setCurrentEventImageUrl(null);
    setCurrentParticipant(null);
    setSearchParams({});
  };

  return (
    <div className="flex-1 flex flex-col">
      {appState === 'home' && (
        <Home onCreateEvent={handleCreateEvent} />
      )}
      
      {appState === 'participant-select' && currentEventId && (
        <ParticipantSelector 
          eventId={currentEventId}
          eventName={currentEventName}
          eventImageUrl={currentEventImageUrl}
          onParticipantSelected={handleParticipantSelected}
          onImageUpdate={handleImageUpdate}
        />
      )}
      
      {appState === 'event' && currentEventId && currentParticipant && (
        <EventManager 
          eventId={currentEventId} 
          currentParticipant={currentParticipant}
        />
      )}
    </div>
  );
};

export default Index;
