import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { NotFoundContent } from '@/components/layout/NotFoundContent';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center pt-10">
      <Link href="/" aria-label="MAGO home">
        <Logo className="w-32" />
      </Link>
      <NotFoundContent />
    </main>
  );
}
