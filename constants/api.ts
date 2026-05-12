// Invidious public instances for YouTube video info extraction
// If one instance goes down, the app can fallback to the next
export const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.fdn.fr',
  'https://invidious.privacyredirect.com',
  'https://inv.nadeko.net',
];

// Default instance to use
export const INVIDIOUS_API_URL = INVIDIOUS_INSTANCES[0];

// Video quality presets
export const VIDEO_QUALITY = {
  sd: '480',
  hd: '720',
} as const;

export type VideoQuality = keyof typeof VIDEO_QUALITY;
