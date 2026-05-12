declare module 'react-native-ytdl' {
  export type Format = {
    url?: string;
    container?: string;
    hasAudio?: boolean;
    hasVideo?: boolean;
  };

  export type VideoInfo = {
    formats: Format[];
  };

  export function validateURL(url: string): boolean;
  export function getInfo(url: string): Promise<VideoInfo>;
  export function chooseFormat(
    formats: Format[],
    options: { quality: string; filter?: (format: Format) => boolean }
  ): Format;
}
