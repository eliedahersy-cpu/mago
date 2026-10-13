'use client';

import { saveSettings, setStaffRole } from '@/app/actions/admin/store';
import type { StoreSettings } from '@/lib/types';
import { ActionForm, errorAria, FieldError, SubmitButton } from './ActionForm';
import { adminInput, adminLabel, Card } from './ui';

const SOCIAL = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
] as const;

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const s = settings;
  return (
    <ActionForm action={saveSettings} messageOnTop className="space-y-4">
      {(state) => {
        const input = (name: string, label: string, value: string | number | null, extra: Record<string, string> = {}) => (
          <div>
            <label htmlFor={name} className={adminLabel}>
              {label}
            </label>
            <input id={name} name={name} defaultValue={value ?? ''} className={`${adminInput} mt-1`} {...extra} {...errorAria(state, name)} />
            <FieldError state={state} name={name} />
          </div>
        );
        return (
          <>
            <Card title="Store">
              <div className="grid gap-3 sm:grid-cols-3">
                {input('storeName', 'Store name', s.storeName)}
                {input('contactEmail', 'Contact email', s.contactEmail, { type: 'email' })}
                {input('contactPhone', 'Contact phone', s.contactPhone, { type: 'tel' })}
              </div>
              <div className="mt-3">
                {input('announcementBar', 'Announcement bar', s.announcementBar, { maxLength: '200', placeholder: 'Empty hides the bar' })}
              </div>
            </Card>
            <Card title="Delivery">
              <div className="grid gap-3 sm:grid-cols-2">
                {input('shippingFlatFee', 'Delivery fee (USD)', s.shippingFlatFee, { inputMode: 'decimal' })}
                {input('freeShippingThreshold', 'Free delivery from (USD)', s.freeShippingThreshold, { inputMode: 'decimal' })}
              </div>
              <div className="mt-3">
                <label htmlFor="deliveryAreas" className={adminLabel}>
                  Delivery areas
                </label>
                <textarea id="deliveryAreas" name="deliveryAreas" rows={6} defaultValue={s.deliveryAreas.join('\n')} className={`${adminInput} mt-1`} />
                <p className="mt-1 text-xs text-ink/55">One per line. These are the governorates customers choose at checkout.</p>
              </div>
            </Card>
            <Card title="Social links">
              <div className="grid gap-3 sm:grid-cols-2">
                {SOCIAL.map((n) => (
                  <div key={n.key}>{input(n.key, n.label, s.socialLinks[n.key] ?? '', { type: 'url', placeholder: 'https://' })}</div>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/55">Shown as icons in the footer. Leave empty to hide.</p>
            </Card>
            <SubmitButton>Save settings</SubmitButton>
          </>
        );
      }}
    </ActionForm>
  );
}

export function StaffRoleForm() {
  return (
    <ActionForm action={setStaffRole} resetOnSuccess className="flex flex-wrap items-end gap-2">
      {(state) => (
        <>
          <div className="min-w-56 flex-1">
            <label htmlFor="staff-email" className={adminLabel}>
              Email of an existing account
            </label>
            <input id="staff-email" name="email" type="email" required className={`${adminInput} mt-1`} {...errorAria(state, 'email')} />
            <FieldError state={state} name="email" />
          </div>
          <div>
            <label htmlFor="staff-role" className={adminLabel}>
              Role
            </label>
            <select id="staff-role" name="role" defaultValue="staff" className={`${adminInput} mt-1`}>
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
              <option value="customer">No admin access</option>
            </select>
          </div>
          <SubmitButton pendingLabel="Saving…">Apply</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
