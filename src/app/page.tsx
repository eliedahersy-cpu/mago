import { ArchDecor, LeafSprig, ScriptNote, SunMark } from '@/components/brand/Decor';
import { Logo } from '@/components/brand/Logo';
import { Badge, ProteinBadge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Pill } from '@/components/ui/Pill';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StarRating } from '@/components/ui/StarRating';
import { ArrowRight } from 'lucide-react';

export default function Page() {
  return (
    <Container className="space-y-8 py-10">
      <div className="flex items-center gap-6">
        <Logo priority />
        <div className="rounded-xl bg-forest p-4"><Logo variant="light" /></div>
        <SunMark className="w-24" />
        <ArchDecor className="w-16" />
        <ArchDecor tone="forest" className="w-16" />
        <LeafSprig className="w-10" />
      </div>
      <SectionHeading title={<>Good food, <span className="text-terracotta">brighter days.</span></>} subtitle="Five moods. Endless possibilities." />
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href="/shop">Explore our cups <ArrowRight size={18} aria-hidden /></ButtonLink>
        <Button variant="outline">View all recipes</Button>
        <Button size="sm">Add to cart</Button>
        <Badge>Best seller</Badge>
        <Badge tone="saffron">Also great</Badge>
        <ProteinBadge />
      </div>
      <div className="flex gap-2"><Pill href="/" active>All</Pill><Pill href="/" active={false}>Fusilli</Pill></div>
      <div className="flex gap-6"><StarRating avg={4.3} count={12} /><StarRating avg={null} count={0} /></div>
      <ScriptNote>Same pasta. More possibilities.</ScriptNote>
    </Container>
  );
}
