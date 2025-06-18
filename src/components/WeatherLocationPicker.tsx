import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WeatherLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: string) => void;
}

const WeatherLocationPicker: React.FC<WeatherLocationPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect
}) => {
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    if (location.trim()) {
      console.log('Setting location to:', location.trim());
      onLocationSelect(location.trim());
      setLocation('');
      onClose();
    }
  };

  const handleCancel = () => {
    setLocation('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCancel();
    }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center font-sans text-lg">
            What's the weather in
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Input 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City name (e.g., Istanbul)"
            className="text-center font-sans"
            variant="default"
            onKeyDown={handleKeyDown}
            autoFocus
          />
          
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!location.trim()}
              variant="primary"
            >
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeatherLocationPicker;
