export type VideoProvider = 'youtube' | 'vimeo' | 'mp4' | 'unknown';

export function detectVideoProvider(url: string): VideoProvider {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.endsWith('.mp4') || url.includes('.mp4')) return 'mp4';
  return 'mp4';
}

export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? null;
}

export function mergeWatchedSegments(
  segments: [number, number][],
  start: number,
  end: number
): [number, number][] {
  const next: [number, number][] = [...segments, [start, end] as [number, number]].sort(
    (a, b) => a[0] - b[0]
  );
  const merged: [number, number][] = [];
  for (const seg of next) {
    if (!merged.length) {
      merged.push(seg);
      continue;
    }
    const last = merged[merged.length - 1];
    if (seg[0] <= last[1] + 2) {
      last[1] = Math.max(last[1], seg[1]);
    } else {
      merged.push(seg);
    }
  }
  return merged;
}

export function segmentsToPercentage(segments: [number, number][], duration: number): number {
  if (!duration) return 0;
  const watched = segments.reduce((acc, [s, e]) => acc + Math.max(0, e - s), 0);
  return Math.min(100, Math.round((watched / duration) * 100));
}
