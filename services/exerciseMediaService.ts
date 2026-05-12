import * as FileSystem from 'expo-file-system';
import { db } from '@/database/schema';
import { INVIDIOUS_INSTANCES, VIDEO_QUALITY, VideoQuality } from '@/constants/api';

// ─── Types ───────────────────────────────────────────────────────
export interface ExerciseMedia {
  id: string;
  exercise_id: string;
  media_type: 'image' | 'video';
  uri: string;
  source_url: string | null;
  order_index: number;
  created_at: string;
}

interface InvidiousFormat {
  url: string;
  itag: string;
  type: string;
  quality: string;
  qualityLabel: string;
  container: string;
  resolution: string;
  encoding: string;
  size?: string;
}

interface InvidiousVideoInfo {
  title: string;
  lengthSeconds: number;
  formatStreams: InvidiousFormat[];
  adaptiveFormats: InvidiousFormat[];
}

// ─── Helpers ─────────────────────────────────────────────────────
const MEDIA_DIR = `${(FileSystem as any).documentDirectory}exercise_media/`;

const ensureMediaDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }
};

const generateId = () => `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

/**
 * Extract YouTube video ID from various URL formats
 */
export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Validate that the URL is a valid YouTube link
 */
export const isValidYoutubeUrl = (url: string): boolean => {
  return extractVideoId(url) !== null;
};

// ─── CRUD Operations ─────────────────────────────────────────────

/**
 * Get all media for a given exercise, ordered by order_index
 */
export const getMediaForExercise = (exerciseId: string): ExerciseMedia[] => {
  try {
    return db.getAllSync<ExerciseMedia>(
      'SELECT * FROM exercise_media WHERE exercise_id = ? ORDER BY order_index ASC',
      [exerciseId]
    );
  } catch (error) {
    console.error('Error loading exercise media:', error);
    return [];
  }
};

/**
 * Add an image from the device gallery to an exercise
 */
export const addImageMedia = async (exerciseId: string, pickerUri: string): Promise<ExerciseMedia | null> => {
  try {
    await ensureMediaDir();
    const id = generateId();
    const ext = pickerUri.split('.').pop() || 'jpg';
    const destUri = `${MEDIA_DIR}${id}.${ext}`;

    await FileSystem.copyAsync({ from: pickerUri, to: destUri });

    const maxOrder = db.getFirstSync<{ m: number }>(
      'SELECT COALESCE(MAX(order_index), -1) as m FROM exercise_media WHERE exercise_id = ?',
      [exerciseId]
    );
    const orderIndex = (maxOrder?.m ?? -1) + 1;

    db.runSync(
      'INSERT INTO exercise_media (id, exercise_id, media_type, uri, order_index) VALUES (?, ?, ?, ?, ?)',
      [id, exerciseId, 'image', destUri, orderIndex]
    );

    return {
      id,
      exercise_id: exerciseId,
      media_type: 'image',
      uri: destUri,
      source_url: null,
      order_index: orderIndex,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error adding image media:', error);
    return null;
  }
};

/**
 * Fetch video info from Invidious API with instance fallback
 */
const fetchVideoInfo = async (videoId: string): Promise<InvidiousVideoInfo> => {
  let lastError: Error | null = null;

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${videoId}?fields=title,lengthSeconds,formatStreams,adaptiveFormats`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Invidious instance ${instance} failed:`, error);
      continue;
    }
  }

  throw new Error(`All Invidious instances failed. Last error: ${lastError?.message}`);
};

/**
 * Get the best matching video URL for the requested quality
 */
const getVideoUrl = (info: InvidiousVideoInfo, quality: VideoQuality): string | null => {
  const targetQuality = VIDEO_QUALITY[quality];

  // First try formatStreams (audio+video combined, easier to play)
  const combinedStream = info.formatStreams
    .filter(f => f.container === 'mp4')
    .sort((a, b) => {
      const aRes = parseInt(a.qualityLabel) || 0;
      const bRes = parseInt(b.qualityLabel) || 0;
      // Find the closest to target without exceeding
      const aDiff = Math.abs(aRes - parseInt(targetQuality));
      const bDiff = Math.abs(bRes - parseInt(targetQuality));
      return aDiff - bDiff;
    });

  if (combinedStream.length > 0) {
    return combinedStream[0].url;
  }

  // Fallback to adaptiveFormats (video-only, but works for playback)
  const adaptiveStream = info.adaptiveFormats
    .filter(f => f.type?.startsWith('video/mp4') && f.qualityLabel)
    .sort((a, b) => {
      const aRes = parseInt(a.qualityLabel) || 0;
      const bRes = parseInt(b.qualityLabel) || 0;
      const aDiff = Math.abs(aRes - parseInt(targetQuality));
      const bDiff = Math.abs(bRes - parseInt(targetQuality));
      return aDiff - bDiff;
    });

  return adaptiveStream.length > 0 ? adaptiveStream[0].url : null;
};

/**
 * Download a YouTube video and add it to the exercise media
 * Returns a callback with download progress
 */
export const downloadAndAddVideo = async (
  exerciseId: string,
  youtubeUrl: string,
  quality: VideoQuality,
  onProgress?: (progress: number) => void
): Promise<ExerciseMedia | null> => {
  try {
    // 1. Extract video ID
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) throw new Error('URL inválida do YouTube');

    onProgress?.(0.05);

    // 2. Fetch video info from Invidious
    const videoInfo = await fetchVideoInfo(videoId);

    // 3. Validate duration (max 2 minutes)
    if (videoInfo.lengthSeconds > 120) {
      throw new Error('Vídeo muito longo. Máximo permitido: 2 minutos.');
    }

    onProgress?.(0.15);

    // 4. Get download URL
    const downloadUrl = getVideoUrl(videoInfo, quality);
    if (!downloadUrl) throw new Error('Não foi possível encontrar o vídeo na qualidade solicitada');

    onProgress?.(0.2);

    // 5. Download the video
    await ensureMediaDir();
    const id = generateId();
    const destUri = `${MEDIA_DIR}${id}.mp4`;

    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      destUri,
      {},
      (downloadProgress) => {
        const progress = 0.2 + (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 0.75;
        onProgress?.(Math.min(progress, 0.95));
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result?.uri) throw new Error('Download falhou');

    onProgress?.(0.98);

    // 6. Save to database
    const maxOrder = db.getFirstSync<{ m: number }>(
      'SELECT COALESCE(MAX(order_index), -1) as m FROM exercise_media WHERE exercise_id = ?',
      [exerciseId]
    );
    const orderIndex = (maxOrder?.m ?? -1) + 1;

    db.runSync(
      'INSERT INTO exercise_media (id, exercise_id, media_type, uri, source_url, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [id, exerciseId, 'video', destUri, youtubeUrl, orderIndex]
    );

    onProgress?.(1);

    return {
      id,
      exercise_id: exerciseId,
      media_type: 'video',
      uri: destUri,
      source_url: youtubeUrl,
      order_index: orderIndex,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
};

/**
 * Delete a media item and its file from disk
 */
export const deleteMedia = async (mediaId: string): Promise<void> => {
  try {
    const media = db.getFirstSync<ExerciseMedia>(
      'SELECT * FROM exercise_media WHERE id = ?',
      [mediaId]
    );

    if (media) {
      // Delete the file from disk
      const fileInfo = await FileSystem.getInfoAsync(media.uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(media.uri);
      }

      // Delete from database
      db.runSync('DELETE FROM exercise_media WHERE id = ?', [mediaId]);
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

/**
 * Replace a media's file (e.g., swap an image for a new one)
 */
export const replaceMedia = async (mediaId: string, newPickerUri: string): Promise<string | null> => {
  try {
    const media = db.getFirstSync<ExerciseMedia>(
      'SELECT * FROM exercise_media WHERE id = ?',
      [mediaId]
    );

    if (!media) return null;

    // Delete old file
    const oldFileInfo = await FileSystem.getInfoAsync(media.uri);
    if (oldFileInfo.exists) {
      await FileSystem.deleteAsync(media.uri);
    }

    // Copy new file
    await ensureMediaDir();
    const ext = newPickerUri.split('.').pop() || 'jpg';
    const destUri = `${MEDIA_DIR}${mediaId}_new.${ext}`;
    await FileSystem.copyAsync({ from: newPickerUri, to: destUri });

    // Update database
    db.runSync('UPDATE exercise_media SET uri = ? WHERE id = ?', [destUri, mediaId]);

    return destUri;
  } catch (error) {
    console.error('Error replacing media:', error);
    return null;
  }
};
