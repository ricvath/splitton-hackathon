import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2 } from 'lucide-react';

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

  const shareViaMessenger = () => {
    // Use Telegram native sharing with bot deep link
    const botUsername = 'splitton_bot'; // Your bot username
    const shareUrl = `https://t.me/${botUsername}?start=${eventId}`;
    const shareText = `Join my expense splitting event: ${eventName}`;
    
    // Check if we're in Telegram WebApp
    if (window.Telegram?.WebApp) {
      try {
        // Use Telegram's native sharing
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.Telegram.WebApp.openTelegramLink(telegramShareUrl);
        return;
      } catch (error) {
        console.warn('Telegram sharing failed, falling back:', error);
      }
    }
    
    // Fallback for regular browsers
    if (navigator.share) {
      navigator.share({
        title: eventName,
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      // Copy to clipboard as final fallback
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
        alert('Invite link copied to clipboard!');
      }).catch(() => {
        alert(`Share this link: ${shareUrl}`);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="p-4 bg-blue-50 rounded-2xl">
          <div className="text-md font-medium text-gray-600 mb-2">Share "{eventName}" with your travel buddies</div>
          <div className="text-sm font-sans text-gray-800 break-all mb-3">
            https://t.me/splitton_bot?start={eventId}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={shareViaMessenger}
              variant="default"
              size="sm"
              className="transition-all duration-300 bg-blue-600 hover:bg-blue-700"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share via Telegram
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
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
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-2xl">
        <h3 className="text-lg font-bold text-black mb-2">How to invite friends:</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Tap "Share via Telegram" for native sharing</li>
          <li>2. Or copy the bot link and send it manually</li>
          <li>3. Friends tap the link to join your event</li>
          <li>4. They can start adding and splitting expenses!</li>
        </ol>
      </div>
    </div>
  );
};

export default InviteSection;
