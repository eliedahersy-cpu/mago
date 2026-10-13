'use client';

import { Printer } from 'lucide-react';
import { adminButton } from './ui';

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={adminButton.primary}>
      <Printer size={16} aria-hidden /> Print
    </button>
  );
}
