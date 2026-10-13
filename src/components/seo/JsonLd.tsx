import { serializeJsonLd } from '@/lib/seo/jsonld';

/** schema.org data for search engines, escaped so page text can never end the script early. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
