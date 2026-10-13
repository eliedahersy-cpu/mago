'use client';

import Image, { type ImageProps } from 'next/image';
import { useLocalMediaSrc } from '@/lib/media/local-media';

type Props = Omit<ImageProps,'src'> & {
  fallback: string;
  slotKey: string;
};

export function ManagedMediaImage({fallback,slotKey,...props}:Props) {
  const source=useLocalMediaSrc(slotKey,fallback);
  return <Image {...props} src={source} unoptimized={source.startsWith('data:')||props.unoptimized}/>;
}
