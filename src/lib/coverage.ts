import type { Person } from '../types';

/**
 * "Primary" = the scripts actually treat the person in depth (life, works, teaching),
 * vs merely mentioning them as a side character. Signal: real works listed, or several
 * teachings explained, or a long bio that also explains a teaching.
 */
export function isPrimary(p: Person): boolean {
  const bio = p.bio?.length ?? 0;
  const works = p.works?.length ?? 0;
  const teachings = p.teachings?.length ?? 0;
  return works >= 1 || teachings >= 2 || (bio >= 450 && teachings >= 1);
}
