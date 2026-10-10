export function AnnouncementBar({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="bg-forest px-4 py-2 text-center font-display text-xs font-medium tracking-wide text-cream-light uppercase">
      {message}
    </div>
  );
}
