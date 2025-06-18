import React from 'react';

interface Participant {
  id: string;
  name: string;
}

interface ParticipantChipsProps {
  participants: Participant[];
  currentParticipant: string;
}

const ParticipantChips: React.FC<ParticipantChipsProps> = ({ 
  participants, 
  currentParticipant 
}) => {
  // Format participants into natural language
  const formatParticipantsList = () => {
    if (participants.length === 0) {
      return "No participants yet";
    }

    if (participants.length === 1) {
      const name = participants[0].name;
      return `with ${name}${name === currentParticipant ? " (you)" : ""}`;
    }

    const names = participants.map(p => {
      const name = p.name;
      return name === currentParticipant ? `${name} (you)` : name;
    });

    if (names.length === 2) {
      return `with ${names.join(' and ')}`;
    }

    const lastParticipant = names.pop();
    return `with ${names.join(', ')}, and ${lastParticipant}`;
  };

  return (
    <div className="text-muted-foreground font-medium">
      {formatParticipantsList()}
    </div>
  );
};

export default ParticipantChips;
