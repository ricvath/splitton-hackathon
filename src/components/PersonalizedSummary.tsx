import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import CoinIcon from './CoinIcon';

interface PersonalizedSummaryProps {
  currentParticipant: string;
  participantCount: number;
  balance: number;
  eventId: string;
  onCopyInvite: () => void;
}

const PersonalizedSummary: React.FC<PersonalizedSummaryProps> = ({
  currentParticipant,
  participantCount,
  balance,
  eventId,
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

  const getSummaryMessage = () => {
    // Only current participant, no other users
    if (participantCount === 1) {
      return (
        <div className="space-y-4">
          <p className="text-gray-600">Invite your travel buddies!</p>
          <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl">
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-3">
                <div className="text-xs font-medium text-gray-600 mb-1">Invite participants</div>
                <div className="text-xs font-sans text-gray-800 break-all">
                  {window.location.origin}?event={eventId}
                </div>
              </div>
              <Button
                onClick={handleCopy}
                variant="primary"
                className="transition-all duration-300"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
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
        </div>
      );
    }

    // Other users exist, show balance information
    if (balance === 0) {
      return (
        <p className="text-gray-600 flex items-center">
          You don't owe anyone nor have any expenses.
        </p>
      );
    } else if (balance > 0) {
      return (
        <p className="text-green-600 font-medium flex items-center">
          You're owed <CoinIcon size={18} className="mx-1" /> {Math.abs(balance).toFixed(2)}.
        </p>
      );
    } else {
      return (
        <p className="text-red-600 font-medium flex items-center">
          You owe <CoinIcon size={18} className="mx-1" /> {Math.abs(balance).toFixed(2)}.
        </p>
      );
    }
  };

  return (
    <div className="space-y-1 mb-8">
      <h2 className="text-lg font-bold text-black">Hi {currentParticipant},</h2>
      {getSummaryMessage()}
    </div>
  );
};

export default PersonalizedSummary;
