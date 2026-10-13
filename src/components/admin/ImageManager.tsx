'use client';

import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState, useTransition, type DragEvent } from 'react';
import { addProductImage, deleteProductImage, moveProductImage, updateProductImage } from '@/app/actions/admin/products';
import type { AdminImage } from '@/lib/data/admin';
import { IMAGE_TYPES, imagePath, imageProblem } from '@/lib/admin/image';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/browser';
import { ActionForm, SubmitButton } from './ActionForm';
import { adminButton, adminInput } from './ui';

/**
 * Product photos: drop or pick files (checked here first: type and size), uploaded straight from the
 * browser to the product-images bucket (staff-only write policy), then recorded by a server action.
 */
export function ImageManager({ productId, images, defaultAlt }: { productId: string; images: AdminImage[]; defaultAlt: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, startUpload] = useTransition();

  function upload(files: FileList | File[]) {
    const list = Array.from(files);
    const errors: string[] = [];
    const ok = list.filter((f) => {
      const problem = imageProblem(f);
      if (problem) errors.push(`${f.name}: ${problem}`);
      return !problem;
    });
    setProblems(errors);
    if (!ok.length) return;
    startUpload(async () => {
      const supabase = createClient();
      const failed: string[] = [];
      for (const file of ok) {
        const path = imagePath(productId, crypto.randomUUID(), file.type);
        const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
        if (error) {
          failed.push(`${file.name}: upload failed (${error.message}).`);
          continue;
        }
        const result = await addProductImage({ productId, path, alt: defaultAlt });
        if (!result.ok) failed.push(`${file.name}: ${result.error}`);
      }
      setProblems((p) => [...p, ...failed]);
    });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors',
          dragging ? 'border-forest bg-cream-light' : 'border-forest/20 bg-white',
        )}
      >
        <ImagePlus size={24} className="text-forest" aria-hidden />
        <p className="text-ink/70">Drop photos here, or</p>
        <button type="button" onClick={() => input.current?.click()} disabled={uploading} className={adminButton.secondary}>
          {uploading ? 'Uploading…' : 'Choose files'}
        </button>
        <p className="text-xs text-ink/55">JPEG, PNG, WebP or AVIF, up to 5 MB each.</p>
        <input
          ref={input}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          multiple
          className="sr-only"
          aria-label="Add product photos"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {problems.length ? (
        <ul role="alert" className="space-y-1 rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}

      {images.length ? (
        <ul className="space-y-3">
          {images.map((img, i) => (
            <li key={img.id} className="flex gap-3 rounded-xl bg-white p-2 ring-1 ring-forest/10">
              <span className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-cream-light">
                <Image src={img.url} alt="" fill sizes="80px" className="object-contain" />
                {i === 0 ? <span className="absolute top-1 left-1 rounded bg-forest px-1 text-[10px] font-semibold text-cream-light">Main</span> : null}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <ActionForm action={updateProductImage} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="imageId" value={img.id} />
                  <label className="min-w-40 flex-1 text-xs text-ink/60">
                    Alt text
                    <input name="alt" defaultValue={img.alt} placeholder="Describe the photo" className={`${adminInput} mt-0.5`} />
                  </label>
                  <label className="text-xs text-ink/60">
                    Kind
                    <select name="kind" defaultValue={img.kind} className={`${adminInput} mt-0.5 w-auto`}>
                      <option value="packshot">Packshot</option>
                      <option value="lifestyle">Lifestyle</option>
                      <option value="video">Video still</option>
                    </select>
                  </label>
                  <SubmitButton variant="secondary" pendingLabel="Saving…">
                    Save
                  </SubmitButton>
                </ActionForm>
                <div className="flex flex-wrap gap-1">
                  <ActionForm action={moveProductImage}>
                    <input type="hidden" name="productId" value={productId} />
                    <input type="hidden" name="imageId" value={img.id} />
                    <SubmitButton name="dir" value="up" variant="secondary" pendingLabel="…" className="px-2" disabled={i === 0}>
                      <ArrowUp size={14} aria-hidden />
                      <span className="sr-only">Move earlier</span>
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={moveProductImage}>
                    <input type="hidden" name="productId" value={productId} />
                    <input type="hidden" name="imageId" value={img.id} />
                    <SubmitButton name="dir" value="down" variant="secondary" pendingLabel="…" className="px-2" disabled={i === images.length - 1}>
                      <ArrowDown size={14} aria-hidden />
                      <span className="sr-only">Move later</span>
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={deleteProductImage}>
                    <input type="hidden" name="imageId" value={img.id} />
                    <SubmitButton variant="danger" pendingLabel="Removing…" confirm="Remove this photo?" className="px-2">
                      <Trash2 size={14} aria-hidden />
                      <span className="sr-only">Remove photo</span>
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/60">No photos yet. The first photo is the one shown in the shop.</p>
      )}
    </div>
  );
}
