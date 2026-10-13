import { Suspense, type ReactNode } from 'react';
import { AccountNav, AccountNavFallback } from '@/components/account/AccountNav';
import { Container } from '@/components/ui/Container';

/** Signed-in account pages. The session is read inside each page's Suspense boundary, not here. */
export default function AccountAreaLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="py-8 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
        <Suspense fallback={<AccountNavFallback />}>
          <AccountNav />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
