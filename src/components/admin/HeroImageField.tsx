'use client';

import { ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { IMAGE_TYPES, imagePath, imageProblem } from '@/lib/admin/image';
import { createClient } from '@/lib/supabase/browser';
import { adminButton, adminInput } from './ui';

/**
 * One photo for a recipe or store: upload (checked first: type and size) to the content-images bucket,
 * or paste a site path / https link. The value travels in a normal form field called `name`.
 */
export function HeroImageField({ name, folder, defaultValue, label = 'Photo' }: { name: string; folder: 'recipes' | 'stores'; defaultValue: string; label?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [problem, setProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    const issue = imageProblem(file);
    setProblem(issue);
    if (issue) return;
    setUploading(true);
    const supabase = createClient();
    const path = imagePath(folder, crypto.randomUUID(), file.type);
    const { error } = await supabase.storage.from('content-images').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
    setUploading(false);
    if (error) {
      setProblem(`Upload failed (${error.message}).`);
      return;
    }
    setValue(supabase.storage.from('content-images').getPublicUrl(path).data.publicUrl);
  }

  const previewable = value.startsWith('/') || value.startsWith('https://');
  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-cream-light ring-1 ring-forest/10">
        {previewable ? <Image src={value} alt="" fill sizes="400px" className="object-cover" /> : <span className="grid h-full place-items-center text-sm text-ink/50">No photo yet</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={uploading} className={adminButton.secondary}>
          <ImagePlus size={16} aria-hidden /> {uploading ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
        </button>
        {value ? (
          <button type="button" onClick={() => setValue('')} className={adminButton.secondary}>
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="sr-only"
        aria-label={`Upload ${label.toLowerCase()}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = '';
        }}
      />
      <label className="block text-xs text-ink/60">
        Or a link
        <input name={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="/images/… or https://…" className={`${adminInput} mt-0.5`} />
      </label>
      <p className="text-xs text-ink/55">JPEG, PNG, WebP or AVIF, up to 5 MB.</p>
      {problem ? (
        <p role="alert" className="text-sm text-terracotta">
          {problem}
        </p>
      ) : null}
    </div>
  );
}
