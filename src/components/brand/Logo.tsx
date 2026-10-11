import Image from 'next/image';
import { cn } from '@/lib/cn';

export function Logo({
  variant = 'dark',
  className,
  priority,
}: {
  variant?: 'dark' | 'light';
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={variant === 'light' ? '/brand/logo-light.webp' : '/brand/logo.webp'}
      alt="MAGO — Made to nourish"
      width={512}
      height={278}
      loading={priority ? 'eager' : undefined}
      className={cn('h-auto w-28', className)}
    />
  );
}
