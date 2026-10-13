import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: { template: '%s · MAGO admin', default: 'MAGO admin' },
  robots: { index: false, follow: false },
};

/** Everything under /admin except the sign-in page. Each page checks requireStaff() itself. */
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
