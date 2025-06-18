import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
}

interface InviteSectionProps {
  eventId: string;
  participants: Participant[];
  currentParticipant: string;
  onCopyInvite: () => void;
}

const InviteSection: React.FC<InviteSectionProps> = ({
  eventId,
  participants,
  currentParticipant,
  onCopyInvite
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (copied) {
      timeout = setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = () => {
    onCopyInvite();
    setCopied(true);
  };

  // Sort participants to put the current user at the top
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.name === currentParticipant) return -1;
    if (b.name === currentParticipant) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="p-4 bg-blue-50 rounded-2xl">
          <div className="text-md font-medium text-gray-600 mb-2">Share this link with your travel buddies</div>
          <div className="text-sm font-sans text-gray-800 break-all mb-3">
            {window.location.origin}?event={eventId}
          </div>
          <Button
            onClick={handleCopy}
            variant="default"
            size="sm"
            className="transition-all duration-300"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Link copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        </div>
      <div>
        <h3 className="text-lg font-bold text-black mb-3">
          Buddies joined <span className='text-sm text-muted-foreground'>({participants.length})</span>
        </h3>
        <div className="space-y-2">
          {sortedParticipants.map(participant => (
            <div key={participant.id} className={`p-3 border-2 rounded-2xl ${participant.name === currentParticipant ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
              <span className="font-medium text-black">{participant.name}</span>
              {participant.name === currentParticipant && (
                <span className="ml-2 text-xs text-gray-600">(you)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InviteSection;
