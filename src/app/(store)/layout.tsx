import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getSettings } from '@/lib/data/cached';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <AnnouncementBar message={settings.announcementBar} />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
    </>
  );
}
