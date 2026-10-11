import { Mail, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArchDecor, SunMark } from '@/components/brand/Decor';
import { Container } from '@/components/ui/Container';
import { infoPages, type InfoSlug } from '@/content/info-pages';
import { getSettings } from '@/lib/data/cached';

// Unknown slugs must return a real 404, so this segment may block instead of streaming a shell.
export const instant = false;

export function generateStaticParams() {
  return Object.keys(infoPages).map((page) => ({ page }));
}

export async function generateMetadata({ params }: PageProps<'/[page]'>): Promise<Metadata> {
  const { page } = await params;
  const info = infoPages[page as InfoSlug];
  return info ? { title: info.title, description: info.intro } : {};
}

export default async function InfoPage({ params }: PageProps<'/[page]'>) {
  const { page } = await params;
  const info = infoPages[page as InfoSlug];
  if (!info) notFound();
  const settings = page === 'contact' ? await getSettings() : null;

  return (
    <div className="relative overflow-hidden">
      <ArchDecor className="pointer-events-none absolute top-10 -right-10 hidden w-28 opacity-40 md:block" />
      <Container className="max-w-3xl py-12 md:py-16">
        <SunMark className="w-16" />
        <h1 className="mt-3 font-display text-4xl leading-none font-bold text-forest md:text-5xl">{info.title}</h1>
        <p className="mt-4 text-lg text-ink/80">{info.intro}</p>

        {settings ? (
          <div className="mt-8 rounded-2xl bg-cream-light p-6 ring-1 ring-forest/5">
            {settings.contactEmail || settings.contactPhone ? (
              <ul className="space-y-3">
                {settings.contactEmail ? (
                  <li className="flex items-center gap-3 text-forest">
                    <Mail size={20} aria-hidden />
                    <a href={`mailto:${settings.contactEmail}`} className="font-medium hover:underline">
                      {settings.contactEmail}
                    </a>
                  </li>
                ) : null}
                {settings.contactPhone ? (
                  <li className="flex items-center gap-3 text-forest">
                    <Phone size={20} aria-hidden />
                    <a href={`tel:${settings.contactPhone}`} className="font-medium hover:underline">
                      {settings.contactPhone}
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="text-ink/80">Our contact details will be published here soon.</p>
            )}
          </div>
        ) : null}

        <div className="mt-10 space-y-8">
          {info.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-bold text-forest">{section.heading}</h2>
              <p className="mt-2 leading-relaxed text-ink/85">{section.body}</p>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
