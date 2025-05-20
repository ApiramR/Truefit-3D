import { useState, useEffect } from 'react';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function AuthenticatedImage({ src, alt, className }: AuthenticatedImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        } else {
          console.error('Failed to load image:', src);
          setImageUrl('/placeholder-image.png');
        }
      } catch (error) {
        console.error('Error loading image:', error);
        setImageUrl('/placeholder-image.png');
      }
    };

    if (src) {
      fetchImage();
    }
  }, [src]);

  return (
    <img
      src={imageUrl || '/placeholder-image.png'}
      alt={alt}
      className={className}
    />
  );
} 