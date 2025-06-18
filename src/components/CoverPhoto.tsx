import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shuffle, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
      console.log('Fetching Unsplash image for:', eventName);
      const { data, error } = await supabase.functions.invoke('unsplash-image', {
        body: { query: eventName }
      });

      if (error) {
        console.error('Error fetching Unsplash image:', error);
        return;
      }

      if (data?.imageUrl) {
        console.log('Received image URL:', data.imageUrl);
        
        // Update local state immediately for better UX
        setLocalImageUrl(data.imageUrl);
        
        // Update the event with the new image URL
        const { error: updateError } = await supabase
          .from('events')
          .update({ image_url: data.imageUrl })
          .eq('id', eventId);

        if (updateError) {
          console.error('Error updating event image:', updateError);
          return;
        }

        onImageUpdate(data.imageUrl);
      } else {
        console.error('No image URL received from Unsplash');
      }
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}/cover.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      // Update local state immediately
      setLocalImageUrl(publicUrl);

      // Update the event with the new image URL
      const { error: updateError } = await supabase
        .from('events')
        .update({ image_url: publicUrl })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating event image:', updateError);
        return;
      }

      onImageUpdate(publicUrl);
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
