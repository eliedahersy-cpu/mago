import { PHONE_PATTERN } from '@/lib/checkout/schema';

/** The subscribe flow in progress. Kept in sessionStorage so signing in at the review step loses nothing. */

export interface DraftAddress {
  fullName: string;
  phone: string;
  governorate: string;
  area: string;
  street: string;
  building: string;
  floor: string;
  notes: string;
}

export interface SubscriptionDraft {
  step: 1 | 2 | 3 | 4;
  planId: string | null;
  cups: Record<string, number>;
  extras: Record<string, number>;
  address: DraftAddress;
  isGift: boolean;
  giftNote: string;
  /** First delivery (YYYY-MM-DD); empty = as soon as possible. */
  startDate: string;
}

export const STEPS = ['Plan', 'Flavours', 'Delivery', 'Review'] as const;

export const EMPTY_ADDRESS: DraftAddress = { fullName: '', phone: '', governorate: '', area: '', street: '', building: '', floor: '', notes: '' };

export const EMPTY_DRAFT: SubscriptionDraft = {
  step: 1,
  planId: null,
  cups: {},
  extras: {},
  address: EMPTY_ADDRESS,
  isGift: false,
  giftNote: '',
  startDate: '',
};

export const DRAFT_KEY = 'mago-subscription-draft';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cupCount(d: Pick<SubscriptionDraft, 'cups'>): number {
  return Object.values(d.cups).reduce((n, q) => n + q, 0);
}

/** Sets one product's quantity; with a box `size`, the total never goes over it. Zero removes it. */
export function setQty(items: Record<string, number>, id: string, qty: number, size: number | null): Record<string, number> {
  const rest = { ...items };
  delete rest[id];
  const others = Object.values(rest).reduce((n, q) => n + q, 0);
  const max = size === null ? 99 : Math.max(0, size - others);
  const q = Math.max(0, Math.min(Math.floor(qty), max));
  return q > 0 ? { ...rest, [id]: q } : rest;
}

export function addressComplete(a: DraftAddress): boolean {
  return a.fullName.trim().length >= 2 && PHONE_PATTERN.test(a.phone.trim()) && Boolean(a.governorate) && Boolean(a.area.trim()) && Boolean(a.street.trim());
}

/** Whether the given step is complete, so the next one can open. */
export function canContinue(d: SubscriptionDraft, step: number, boxSize: number): boolean {
  if (step === 1) return d.planId !== null;
  if (step === 2) return canContinue(d, 1, boxSize) && cupCount(d) === boxSize;
  if (step === 3) return canContinue(d, 2, boxSize) && addressComplete(d.address) && d.giftNote.length <= 200;
  return canContinue(d, 3, boxSize);
}

/** What quote_subscription / create_subscription take. */
export function toItems(d: Pick<SubscriptionDraft, 'cups' | 'extras'>) {
  const list = (r: Record<string, number>) => Object.entries(r).map(([product_id, quantity]) => ({ product_id, quantity }));
  return { cups: list(d.cups), extras: list(d.extras) };
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

function quantities(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, q] of Object.entries(obj(v))) {
    if (UUID.test(id) && typeof q === 'number' && Number.isInteger(q) && q > 0) out[id] = Math.min(q, 99);
  }
  return out;
}

/** Reads a stored draft, dropping anything malformed. */
export function sanitizeDraft(raw: unknown): SubscriptionDraft {
  const d = obj(raw);
  const a = obj(d.address);
  const step = d.step === 2 || d.step === 3 || d.step === 4 ? d.step : 1;
  return {
    step,
    planId: typeof d.planId === 'string' && UUID.test(d.planId) ? d.planId : null,
    cups: quantities(d.cups),
    extras: quantities(d.extras),
    address: {
      fullName: str(a.fullName, 100),
      phone: str(a.phone, 20),
      governorate: str(a.governorate, 60),
      area: str(a.area, 100),
      street: str(a.street, 200),
      building: str(a.building, 100),
      floor: str(a.floor, 50),
      notes: str(a.notes, 200),
    },
    isGift: d.isGift === true,
    giftNote: str(d.giftNote, 200),
    startDate: typeof d.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.startDate) ? d.startDate : '',
  };
}
