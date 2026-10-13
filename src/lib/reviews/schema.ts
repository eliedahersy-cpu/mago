import { z } from 'zod';
import { type FormResult, num, optionalText, parseWith, text } from '@/lib/admin/form-data';

/** Same limits as submit_review in SQL (migration 0010). */
const reviewSchema = z.object({
  productId: z.uuid('This product could not be found.'),
  rating: z.number({ error: 'Choose a rating from 1 to 5 stars.' }).int().min(1, 'Choose a rating from 1 to 5 stars.').max(5, 'Choose a rating from 1 to 5 stars.'),
  title: z.string().max(80, 'Keep the title under 80 characters.').nullable(),
  body: z.string().min(10, 'Write at least 10 characters.').max(1000, 'Keep it under 1,000 characters.'),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export function parseReviewForm(fd: FormData): FormResult<ReviewInput> {
  return parseWith(reviewSchema, {
    productId: text(fd, 'productId'),
    rating: num(fd, 'rating') ?? Number.NaN,
    title: optionalText(fd, 'title'),
    body: text(fd, 'body'),
  });
}
