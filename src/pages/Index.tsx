import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Home from '@/components/Home';
import ParticipantSelector from '@/components/ParticipantSelector';
import EventManager from '@/components/EventManager';
import { generateEventId } from '@/utils/expenseCalculator';
import { useTelegramData } from '@/hooks/useTelegramData';
import { cloudStorage } from '@/storage/cloudStorage';
import { localDB } from '@/storage/indexedDB';
import { CloudEvent, CloudParticipant } from '@/storage/types';

type AppState = 'home' | 'participant-select' | 'event';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentEventName, setCurrentEventName] = useState<string>('');
  const [currentEventImageUrl, setCurrentEventImageUrl] = useState<string | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, startParam, isAvailable } = useTelegramData();

  useEffect(() => {
    // Handle Telegram start parameter (event invitation)
    if (startParam) {
      setCurrentEventId(startParam);
      checkEventAndParticipant(startParam);
      return;
    }

    // Handle URL parameter
    const eventId = searchParams.get('event');
    if (eventId) {
      setCurrentEventId(eventId);
      checkEventAndParticipant(eventId);
    }
  }, [searchParams, startParam]);

  const getStoredParticipant = (eventId: string): string | null => {
    if (!user) return null;
    
    // In Web3 version, we use Telegram user ID as the participant identifier
    // But we still need to check if they're actually part of this event
    return localStorage.getItem(`participant_${eventId}_${user.id}`);
  };

  const storeParticipant = (eventId: string, participantName: string) => {
    if (!user) return;
    localStorage.setItem(`participant_${eventId}_${user.id}`, participantName);
  };

  const checkEventAndParticipant = async (eventId: string) => {
    try {
      // Try to get event from cloud storage first, then fallback to IndexedDB
      let eventData: CloudEvent | null = null;
      
      try {
        eventData = await cloudStorage.getEvent(eventId);
      } catch (error) {
        console.warn('Cloud storage unavailable, trying IndexedDB:', error);
        eventData = await localDB.getEvent(eventId);
      }

      if (!eventData || !eventData.isActive) {
        setAppState('home');
        setSearchParams({});
        return;
      }

      setCurrentEventName(eventData.name);
      setCurrentEventImageUrl(eventData.imageUrl || null);

      if (!user) {
        // If no Telegram user, go to participant selector
        setAppState('participant-select');
        return;
      }

      // Check if user is already a participant in this event
      const existingParticipant = eventData.participants.find(
        p => p.telegramId === user.id.toString() && p.isActive
      );

      if (existingParticipant) {
        setCurrentParticipant(existingParticipant.firstName);
        setAppState('event');
        return;
      }

      // Check if user has a stored participant name for this event
      const storedParticipantName = getStoredParticipant(eventId);
      if (storedParticipantName) {
        // Verify this participant name is still valid for this event
        const participantExists = eventData.participants.find(
          p => p.firstName === storedParticipantName && p.isActive
        );
        
        if (participantExists) {
          setCurrentParticipant(storedParticipantName);
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
      if (!user) {
        console.error('No user available for event creation');
        return;
      }

      const eventId = generateEventId();
      
      const newEvent: CloudEvent = {
        id: eventId,
        name: eventName,
        description: '',
        createdBy: user.id.toString(),
        participants: [],
        expenses: [],
        imageUrl: initialImageUrl,
        currency: 'USD', // Default currency, can be changed later
        createdAt: Date.now(),
        lastModified: Date.now(),
        isActive: true,
      };

      // Save to both cloud storage and IndexedDB
      try {
        await cloudStorage.saveEvent(newEvent);
        await cloudStorage.addUserToEvent(user.id.toString(), eventId);
      } catch (error) {
        console.warn('Cloud storage failed, saving to IndexedDB:', error);
      }
      
      await localDB.saveEvent(newEvent);
      const userEvents = await localDB.getUserEvents(user.id.toString());
      await localDB.saveUserEvents(user.id.toString(), [...userEvents, eventId]);

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
    if (currentEventId && user) {
      storeParticipant(currentEventId, participantName);
    }
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
