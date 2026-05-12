import { VideoQuality } from '@/constants/api';
import { db } from '@/database/schema';
import * as FileSystem from 'expo-file-system/legacy';
import ytdl from 'react-native-ytdl';

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

export interface DownloadResult {
  localUri: string;
  fileName: string;
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
  return ytdl.validateURL(url);
};

export const downloadYouTubeVideoOnDevice = async (
  youtubeUrl: string,
  exerciseId: string,
  quality: VideoQuality
): Promise<DownloadResult> => {
  try {
    const isValid = ytdl.validateURL(youtubeUrl);
    if (!isValid) {
      throw new Error('URL do YouTube inválida.');
    }

    const info = await ytdl.getInfo(youtubeUrl);
    const preferredQuality = quality === 'hd' ? 'highestvideo' : 'lowestvideo';
    const format = ytdl.chooseFormat(info.formats, {
      quality: preferredQuality,
      filter: (f: any) => f.container === 'mp4' && f.hasAudio && f.hasVideo,
    });

    if (!format || !format.url) {
      throw new Error('Nenhum formato MP4 compatível encontrado para download direto.');
    }

    await ensureMediaDir();
    const fileName = `exercise_${exerciseId}_${Date.now()}.mp4`;
    const fileUri = `${MEDIA_DIR}${fileName}`;

    const downloadRes = await FileSystem.downloadAsync(format.url, fileUri);
    if (downloadRes.status !== 200) {
      throw new Error('Falha ao transferir o arquivo de mídia.');
    }

    return {
      localUri: downloadRes.uri,
      fileName,
    };
  } catch (error: any) {
    console.error('Erro no processamento nativo de vídeo:', error);
    throw new Error(error.message || 'Erro desconhecido ao baixar o vídeo.');
  }
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
    onProgress?.(0.1);

    const result = await downloadYouTubeVideoOnDevice(youtubeUrl, exerciseId, quality);
    const destUri = result.localUri;
    if (!destUri) throw new Error('Download falhou');

    onProgress?.(0.98);

    // 6. Save to database
    const id = generateId();
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
