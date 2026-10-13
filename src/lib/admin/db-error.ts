/** What staff see when the database refuses something; unexpected errors are logged, not shown. */
export function dbErrorMessage(error: { code?: string; message: string } | null | undefined, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;
  // P0001 = raised on purpose by our SQL functions with a message written for people.
  if (error.code === 'P0001') return error.message;
  if (error.code === '42501') return 'Your account does not have permission to do that.';
  if (error.code === '23505') return 'That is already in use. Choose another.';
  if (error.code === '23514') return 'One of the values is not allowed.';
  console.error('[admin]', error.code, error.message);
  return fallback;
}
