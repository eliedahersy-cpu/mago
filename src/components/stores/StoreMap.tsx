'use client';

import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

/** Lebanon, roughly: the view before there is anything to fit the map to. */
const LEBANON: [number, number] = [33.89, 35.6];

const pin = (active: boolean) =>
  `<span style="display:block;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${active ? '#c14120' : '#023025'};border:3px solid #fdf6ec;box-shadow:0 4px 10px rgba(2,48,37,.35)"></span>`;

const youAreHere =
  '<span style="display:block;width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25)"></span>';

/**
 * OpenStreetMap through Leaflet (no API key). Shows store pins; `onSelect` when a pin is chosen;
 * `onPick` turns a click on the map into coordinates (admin). Leaflet needs the browser, so it loads in an effect.
 */
export function StoreMap({
  points,
  activeId = null,
  onSelect,
  onPick,
  user = null,
  className,
  zoom,
}: {
  points: MapPoint[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onPick?: (p: { lat: number; lng: number }) => void;
  user?: { lat: number; lng: number } | null;
  className?: string;
  zoom?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const leaflet = useRef<typeof import('leaflet') | null>(null);
  const markers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const handlers = useRef({ onSelect, onPick });
  useEffect(() => {
    handlers.current = { onSelect, onPick };
  });

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !el.current || map.current) return;
      leaflet.current = L;
      const m = L.map(el.current, { scrollWheelZoom: false }).setView(LEBANON, 9);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      m.on('click', (e) => handlers.current.onPick?.({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) }));
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Pins (and you), then fit the view: the chosen store, or everything on the map.
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    if (!ready || !L || !m) return;
    for (const mk of markers.current) mk.remove();
    markers.current = points.map((p) =>
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className: '', html: pin(p.id === activeId), iconSize: [30, 30], iconAnchor: [15, 30] }),
        title: p.label,
        alt: p.label,
        zIndexOffset: p.id === activeId ? 1000 : 0,
      })
        .addTo(m)
        .on('click', () => handlers.current.onSelect?.(p.id)),
    );
    if (user) {
      markers.current.push(
        L.marker([user.lat, user.lng], {
          icon: L.divIcon({ className: '', html: youAreHere, iconSize: [16, 16], iconAnchor: [8, 8] }),
          title: 'You are here',
          alt: 'You are here',
        }).addTo(m),
      );
    }
    const active = points.find((p) => p.id === activeId);
    if (active) {
      m.setView([active.lat, active.lng], Math.max(m.getZoom(), zoom ?? 13));
      return;
    }
    const all: [number, number][] = [...points.map((p) => [p.lat, p.lng] as [number, number]), ...(user ? [[user.lat, user.lng] as [number, number]] : [])];
    if (all.length === 1) m.setView(all[0], zoom ?? 14);
    else if (all.length > 1) m.fitBounds(L.latLngBounds(all), { padding: [40, 40], maxZoom: 14 });
  }, [ready, points, activeId, user, zoom]);

  return <div ref={el} role="region" aria-label="Map of MAGO stores" className={cn('isolate z-0 overflow-hidden rounded-2xl bg-cream-dark', className)} />;
}
