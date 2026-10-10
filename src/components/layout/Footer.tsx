import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Container } from '@/components/ui/Container';
import { footerNav } from '@/config/navigation';
import type { SocialNetwork, StoreSettings } from '@/lib/types';
import { NewsletterForm } from './NewsletterForm';

const socialIcons: Record<SocialNetwork, { label: string; path: string }> = {
  instagram: {
    label: 'Instagram',
    path: 'M12 2.2c3.2 0 3.6 0 4.8.1 3.3.2 4.8 1.7 5 5 .1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.2 3.2-1.7 4.8-5 5-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.2-4.8-1.7-5-5C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.2-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2Zm0 4.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8Zm5.4-9.9a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z',
  },
  tiktok: {
    label: 'TikTok',
    path: 'M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.6 1.5V6.7a4.6 4.6 0 0 1-4.6-4.7Z',
  },
  facebook: {
    label: 'Facebook',
    path: 'M13.5 21.9v-7.7h2.6l.4-3h-3V9.3c0-.9.3-1.5 1.6-1.5h1.6V5.1a22 22 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.2H7.7v3h2.6v7.7a10 10 0 1 1 3.2 0Z',
  },
  youtube: {
    label: 'YouTube',
    path: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.7 2 12 2 12s0 3.3.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.5.4-4.8.4-4.8s0-3.3-.4-4.8ZM10 15V9l5.2 3L10 15Z',
  },
};

export function Footer({ settings }: { settings: StoreSettings }) {
  const socials = (Object.keys(socialIcons) as SocialNetwork[]).filter((n) => settings.socialLinks[n]);
  return (
    <footer className="mt-auto bg-forest text-cream-light">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.1fr_repeat(3,0.8fr)_1.6fr] md:py-14">
        <div>
          <Link href="/" aria-label="MAGO home">
            <Logo variant="light" className="w-36" />
          </Link>
        </div>

        {footerNav.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="font-display text-sm font-semibold tracking-wide uppercase">{column.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-cream-light/80">
              {column.items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-cream-light hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="font-display text-sm font-semibold tracking-wide uppercase">Join the MAGO community</h2>
          <p className="mt-2 mb-4 text-sm text-cream-light/80">Get exclusive recipes, offers and new flavours.</p>
          <NewsletterForm />
          {socials.length > 0 ? (
            <ul className="mt-4 flex gap-3">
              {socials.map((network) => (
                <li key={network}>
                  <a
                    href={settings.socialLinks[network]}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={socialIcons[network].label}
                    className="flex size-9 items-center justify-center rounded-full bg-cream-light/10 hover:bg-cream-light/20"
                  >
                    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                      <path d={socialIcons[network].path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
      <div className="border-t border-cream-light/10">
        <Container className="py-5 text-xs text-cream-light/60">
          © <CurrentYear /> {settings.storeName}. Made to nourish.
        </Container>
      </div>
    </footer>
  );
}

async function CurrentYear() {
  'use cache';
  cacheLife('days');
  return <>{new Date().getFullYear()}</>;
}
