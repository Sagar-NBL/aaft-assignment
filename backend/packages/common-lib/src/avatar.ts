/**
 * Generate a deterministic avatar URL for a user given their name.
 * Uses ui-avatars.com — the same convention the reference frontend mock uses.
 */
export function generateAvatar(name: string): string {
  const initials = encodeURIComponent(name.trim() || 'AAFT User');
  return `https://ui-avatars.com/api/?name=${initials}&background=0A2540&color=D4AF37&bold=true`;
}
