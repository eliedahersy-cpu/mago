import type { Metadata } from 'next';
import { Caveat, DM_Sans, Fredoka } from 'next/font/google';
import './globals.css';

const fredoka = Fredoka({ variable: '--font-fredoka', subsets: ['latin'], weight: ['500', '600', '700'] });
const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] });
const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'], weight: ['600', '700'] });

export const metadata: Metadata = {
  title: { default: 'MAGO — Good food, brighter days.', template: '%s | MAGO' },
  description:
    'Nourishing pasta cups inspired by Mediterranean flavours. Real ingredients. Big taste. Ready in minutes.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${dmSans.variable} ${caveat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
