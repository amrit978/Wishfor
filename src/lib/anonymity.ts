import { TrustLevel } from '@/types';

const CIPHERS = [
  'Moth', 'Lantern', 'Kite', 'Fox', 'Owl', 'Pine', 'Stone',
  'Sparrow', 'Crane', 'Flute', 'Well', 'Smoke', 'Candle', 'Raven',
  'Lotus', 'Feather', 'Deer', 'Willow', 'Harbor', 'Bell', 'Compass', 'Echo'
];

const MODIFIERS = [
  'Quiet', 'Silver', 'Midnight', 'Amber', 'Velvet', 'Desert', 'River',
  'Dusk', 'Copper', 'Hidden', 'Cedar', 'Pale', 'Solar', 'Golden',
  'Winter', 'Shadow', 'Wandering', 'Mist', 'Humble', 'Gentle', 'Obsidian', 'Boreal'
];

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getMaskForThread(userId: string, postId: string, isAsker: boolean = false) {
  const combo = `${postId}__${userId}__v3`;
  const hash = hashString(combo);

  const modIdx = hash % MODIFIERS.length;
  const cipherIdx = Math.floor(hash / MODIFIERS.length) % CIPHERS.length;
  const freqCode = ((hash % 899) + 100) / 10;

  const maskName = `${MODIFIERS[modIdx]} ${CIPHERS[cipherIdx]}`;
  const seed = `${hash % 8}-${hash % 1000}`;

  return {
    mask_name: maskName,
    mask_seed: seed,
    is_asker: isAsker,
    callsign: `Mask: ${maskName}`,
  };
}

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 100) return 'Trusted Voice';
  if (score >= 50) return 'Guide';
  if (score >= 20) return 'Helper';
  if (score >= 5) return 'Listener';
  return 'Newcomer';
}

export function getTrustBadgeDetails(level: TrustLevel) {
  switch (level) {
    case 'Trusted Voice':
      return {
        label: 'Trusted Voice',
        tag: 'TIER-V',
        color: 'text-amber-300/90 border-amber-500/40 bg-amber-950/20',
        dot: 'bg-amber-400',
      };
    case 'Guide':
      return {
        label: 'Guide',
        tag: 'TIER-IV',
        color: 'text-emerald-300/90 border-emerald-500/30 bg-emerald-950/20',
        dot: 'bg-emerald-400',
      };
    case 'Helper':
      return {
        label: 'Helper',
        tag: 'TIER-III',
        color: 'text-cyan-300/90 border-cyan-500/30 bg-cyan-950/20',
        dot: 'bg-cyan-400',
      };
    case 'Listener':
      return {
        label: 'Listener',
        tag: 'TIER-II',
        color: 'text-zinc-300 border-zinc-700/50 bg-zinc-900/40',
        dot: 'bg-zinc-400',
      };
    case 'Newcomer':
    default:
      return {
        label: 'Newcomer',
        tag: 'TIER-I',
        color: 'text-zinc-400 border-zinc-800 bg-zinc-950/40',
        dot: 'bg-zinc-600',
      };
  }
}
