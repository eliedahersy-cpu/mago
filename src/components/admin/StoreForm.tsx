'use client';

import { useMemo, useState } from 'react';
import { deleteStore, saveStore } from '@/app/actions/admin/stores';
import { StoreMap } from '@/components/stores/StoreMap';
import { STORE_TYPES } from '@/lib/stores/geo';
import { ActionForm, errorAria, FieldError, SubmitButton } from './ActionForm';
import { HeroImageField } from './HeroImageField';
import { adminInput, adminLabel, Card } from './ui';

export interface StoreDefaults {
  id: string | null;
  name: string;
  slug: string;
  chain: string;
  type: string;
  address: string;
  area: string;
  city: string;
  lat: string;
  lng: string;
  hours: string;
  phone: string;
  website: string;
  image: string;
  isActive: boolean;
  productIds: string[];
}

export function StoreForm({ defaults, products }: { defaults: StoreDefaults; products: { id: string; label: string }[] }) {
  const d = defaults;
  const [lat, setLat] = useState(d.lat);
  const [lng, setLng] = useState(d.lng);
  const point = useMemo(() => {
    const la = Number(lat);
    const ln = Number(lng);
    return lat && lng && Number.isFinite(la) && Number.isFinite(ln) ? [{ id: 'here', lat: la, lng: ln, label: d.name || 'Store' }] : [];
  }, [lat, lng, d.name]);

  return (
    <div className="space-y-4">
      <ActionForm action={saveStore} messageOnTop className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {(state) => {
          const input = (name: string, label: string, value: string, extra: Record<string, string> = {}) => (
            <div>
              <label htmlFor={name} className={adminLabel}>
                {label}
              </label>
              <input id={name} name={name} defaultValue={value} className={`${adminInput} mt-1`} {...extra} {...errorAria(state, name)} />
              <FieldError state={state} name={name} />
            </div>
          );
          return (
            <>
              {d.id ? <input type="hidden" name="id" value={d.id} /> : null}
              <div className="space-y-4">
                <Card title="Store">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {input('name', 'Name', d.name, { required: 'true' })}
                    {input('chain', 'Chain', d.chain, { placeholder: 'e.g. Spinneys' })}
                    <div>
                      <label htmlFor="type" className={adminLabel}>
                        Type
                      </label>
                      <select id="type" name="type" defaultValue={d.type} className={`${adminInput} mt-1`}>
                        {STORE_TYPES.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label.replace(/s$/, '').replace('Cafés & Restaurant', 'Café or restaurant')}
                          </option>
                        ))}
                      </select>
                    </div>
                    {input('hours', 'Opening hours', d.hours, { placeholder: 'e.g. Open until 10:00 PM' })}
                    {input('address', 'Address', d.address)}
                    {input('area', 'Area', d.area)}
                    {input('city', 'City', d.city)}
                    {input('phone', 'Phone', d.phone, { type: 'tel' })}
                    {input('website', 'Website', d.website, { type: 'url', placeholder: 'https://' })}
                  </div>
                </Card>
                <Card title="Location">
                  <p className="mb-2 text-sm text-ink/70">Click the map where the store is, or type the coordinates.</p>
                  <StoreMap points={point} activeId="here" onPick={(p) => {
                      setLat(String(p.lat));
                      setLng(String(p.lng));
                    }} zoom={15} className="h-72" />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="lat" className={adminLabel}>
                        Latitude
                      </label>
                      <input id="lat" name="lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} className={`${adminInput} mt-1`} {...errorAria(state, 'lat')} />
                      <FieldError state={state} name="lat" />
                    </div>
                    <div>
                      <label htmlFor="lng" className={adminLabel}>
                        Longitude
                      </label>
                      <input id="lng" name="lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} className={`${adminInput} mt-1`} {...errorAria(state, 'lng')} />
                      <FieldError state={state} name="lng" />
                    </div>
                  </div>
                </Card>
              </div>
              <div className="space-y-4">
                <Card title="Status">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={d.isActive} className="size-4 accent-forest" /> Show on the store locator
                  </label>
                  <SubmitButton className="mt-4 w-full">{d.id ? 'Save store' : 'Create store'}</SubmitButton>
                </Card>
                <Card title="Photo">
                  <HeroImageField name="image" folder="stores" defaultValue={d.image} />
                  <FieldError state={state} name="image" />
                </Card>
                <Card title="MAGO products sold here">
                  <div className="max-h-72 space-y-1.5 overflow-y-auto">
                    {products.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="productIds" value={p.id} defaultChecked={d.productIds.includes(p.id)} className="size-4 accent-forest" />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </Card>
                <Card title="Web address">
                  {input('slug', 'URL handle', d.slug, { placeholder: 'made from the name if empty' })}
                </Card>
              </div>
            </>
          );
        }}
      </ActionForm>
      {d.id ? (
        <ActionForm action={deleteStore}>
          <input type="hidden" name="id" value={d.id} />
          <SubmitButton variant="danger" pendingLabel="Deleting…" confirm="Delete this store from the locator?">
            Delete store
          </SubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}
