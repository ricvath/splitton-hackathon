import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface InviteSectionProps {
  eventId: string;
  eventName: string;
  onCopyInviteUrl: () => void;
}

const InviteSection: React.FC<InviteSectionProps> = ({
  eventId,
  eventName,
  onCopyInviteUrl
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
    onCopyInviteUrl();
    setCopied(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="p-4 bg-blue-50 rounded-2xl">
          <div className="text-md font-medium text-gray-600 mb-2">Share "{eventName}" with your travel buddies</div>
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
      
      <div className="p-4 bg-gray-50 rounded-2xl">
        <h3 className="text-lg font-bold text-black mb-2">How to invite friends:</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Copy the link above</li>
          <li>2. Share it with your friends via Telegram, WhatsApp, etc.</li>
          <li>3. They'll be able to join and add expenses</li>
        </ol>
      </div>
    </div>
  );
};

export default InviteSection;
