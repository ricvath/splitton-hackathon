import React, { useState } from 'react';
import EventsList from './EventsList';
import EventCreator from './EventCreator';

interface HomeProps {
  onCreateEvent: (eventName: string) => void;
}

const Home: React.FC<HomeProps> = ({ onCreateEvent }) => {
  const [showEventCreator, setShowEventCreator] = useState(false);

  const handleSelectEvent = (eventId: string) => {
    // Navigate to the selected event
    window.location.href = `/?event=${eventId}`;
  };

  const handleCreateEvent = () => {
    setShowEventCreator(true);
  };

  const handleEventCreated = (eventId: string) => {
    // Navigate to the newly created event
    window.location.href = `/?event=${eventId}`;
  };

  if (showEventCreator) {
    return <EventCreator onEventCreated={handleEventCreated} />;
  }

  return (
    <EventsList 
      onSelectEvent={handleSelectEvent}
      onCreateEvent={handleCreateEvent}
    />
  );
};

export default Home;
