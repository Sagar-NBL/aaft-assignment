"use client";

import Image from 'next/image';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { useEffect, useState } from 'react';

export interface SafeImageProps extends ComponentPropsWithoutRef<'img'> {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  fallback?: string;
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=500&fit=crop';

const isRemoteUrl = (src: string) => /^https?:\/\//i.test(src);

const isNextImageHost = (src: string) => {
  if (!isRemoteUrl(src)) return false;
  try {
    const url = new URL(src);
    return url.hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
};

const normalizeDimension = (value?: number | string) => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (/^\d+$/.test(value)) return Number(value);
  return undefined;
};

export function SafeImage({
  src,
  alt,
  fill = false,
  className,
  style,
  width,
  height,
  fallback,
  ...props
}: SafeImageProps) {
  const fallbackToUse = fallback || DEFAULT_FALLBACK;
  const [useNativeImg, setUseNativeImg] = useState(() => !isNextImageHost(src));
  const [currentSrc, setCurrentSrc] = useState(src || fallbackToUse);

  useEffect(() => {
    setUseNativeImg(!isNextImageHost(src));
    setCurrentSrc(src || fallbackToUse);
  }, [src, fallbackToUse]);

  const handleError = () => {
    if (currentSrc !== fallbackToUse) {
      setUseNativeImg(true);
      setCurrentSrc(fallbackToUse);
    }
  };

  const imgClassName = [className, fill ? 'absolute inset-0 h-full w-full object-cover' : '']
    .filter(Boolean)
    .join(' ');

  if (useNativeImg || !currentSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={currentSrc || fallbackToUse} alt={alt} className={imgClassName} style={style} onError={handleError} {...props} />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      className={className}
      style={style}
      width={normalizeDimension(width)}
      height={normalizeDimension(height)}
      onError={handleError}
      {...props}
    />
  );
}
