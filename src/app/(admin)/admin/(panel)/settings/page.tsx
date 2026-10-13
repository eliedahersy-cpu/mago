import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsForm, StaffRoleForm } from '@/components/admin/SettingsForms';
import { Card, LoadingBlock, PageHeader, Pill } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listStaff } from '@/lib/data/admin';
import { getSettings } from '@/lib/data/content';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const me = await requireStaff('/admin/settings');
  // Read straight from the database (not the shop's cache) so the form shows what is saved.
  const [settings, staff] = await Promise.all([getSettings(), listStaff()]);
  return (
    <>
      <PageHeader title="Settings" description="Changes show on the website straight away." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SettingsForm settings={settings} />
        <Card title="Admin access">
          <ul className="divide-y divide-forest/5">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-forest">{s.fullName || s.email}</span>
                  <span className="block truncate text-xs text-ink/60">{s.email}</span>
                </span>
                <Pill tone={s.role === 'owner' ? 'good' : 'neutral'}>{s.role === 'owner' ? 'Owner' : 'Staff'}</Pill>
              </li>
            ))}
          </ul>
          {me.role === 'owner' ? (
            <div className="mt-4 border-t border-forest/10 pt-4">
              <p className="mb-2 text-sm text-ink/70">The person must have signed up on the website first.</p>
              <StaffRoleForm />
            </div>
          ) : (
            <p className="mt-3 text-xs text-ink/60">Only the owner can give or remove admin access.</p>
          )}
        </Card>
      </div>
    </>
  );
}
