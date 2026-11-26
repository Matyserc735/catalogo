import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ProductImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200/80 text-stone-400 p-4 text-center select-none"
        role="img"
        aria-label={alt}
      >
        <Package className="w-8 h-8 mb-1.5 stroke-[1.5]" />
        {fallbackLabel ? (
          <span className="text-xs font-medium text-stone-500 line-clamp-2 max-w-[16ch]">
            {fallbackLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
}
