import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shuffle, Upload } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface CoverPhotoProps {
  eventId: string;
  eventName: string;
  imageUrl?: string | null;
  onImageUpdate: (imageUrl: string) => void;
}

const CoverPhoto: React.FC<CoverPhotoProps> = ({ 
  eventId, 
  eventName, 
  imageUrl, 
  onImageUpdate 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setLocalImageUrl(imageUrl || null);
  }, [imageUrl]);

  const fetchUnsplashImage = async () => {
    setIsLoading(true);
    try {
      // For now, use a placeholder image service
      // In the future, you could implement this with a serverless function
      const query = encodeURIComponent(eventName);
      const imageUrl = `https://source.unsplash.com/800x400/?${query}`;
      
      // Update local state immediately for better UX
      setLocalImageUrl(imageUrl);
      onImageUpdate(imageUrl);
    } catch (error) {
      console.error('Error fetching image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Create a local URL for the uploaded file
      const localUrl = URL.createObjectURL(file);
      
      // Update local state immediately
      setLocalImageUrl(localUrl);
      onImageUpdate(localUrl);
      
      // Note: In a production app, you'd want to upload this to a proper storage service
      // For now, we'll just use the local blob URL
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative mb-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AspectRatio ratio={2 / 1} className="bg-gray-200 rounded-3xl overflow-hidden">
        {localImageUrl ? (
          <img 
            src={localImageUrl} 
            alt={eventName}
            className="w-full h-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-gray-200">
            <span className="text-gray-500 font-medium">NO COVER IMAGE</span>
          </div>
        )}
        
        {(isHovered || isLoading) && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center gap-4">
            <Button
              onClick={fetchUnsplashImage}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="bg-white text-black"
            >
              <Shuffle />
              {isLoading ? 'Loading...' : 'Shuffle'}
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="bg-white text-black"
            >
              <Upload />
              Upload
            </Button>
          </div>
        )}
      </AspectRatio>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default CoverPhoto;
