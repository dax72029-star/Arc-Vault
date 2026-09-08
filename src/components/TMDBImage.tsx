import { useState, useCallback } from 'react';
import { TMDB } from '../config/tmdb';

interface TMDBImageProps {
  path: string | null | undefined;
  alt: string;
  size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
  backdropSize?: 'w300' | 'w780' | 'w1280' | 'original';
  type?: 'poster' | 'backdrop';
  className?: string;
  fallbackClassName?: string;
  fallbackText?: string;
  lazy?: boolean;
}

export default function TMDBImage({
  path,
  alt,
  size = 'w500',
  backdropSize = 'w1280',
  type = 'poster',
  className = '',
  fallbackClassName = '',
  fallbackText,
  lazy = true,
}: TMDBImageProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = useCallback(() => {
    if (!imgError) setImgError(true);
  }, [imgError]);

  const src = type === 'backdrop'
    ? TMDB.backdrop(path, backdropSize)
    : TMDB.poster(path, size);

  if (!src || imgError) {
    return (
      <div className={`flex items-center justify-center text-vault-muted text-xs ${fallbackClassName || 'w-full h-full'}`}>
        {fallbackText || 'N/A'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      // @ts-ignore - fetchPriority is valid but not in TS DOM yet
      fetchPriority={lazy ? 'low' : 'high'}
      onLoad={() => setLoaded(true)}
      onError={handleError}
    />
  );
}
