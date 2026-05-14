import { db } from '@/database/schema';
import * as FileSystem from 'expo-file-system/legacy';

export interface ExerciseMedia {
  id: string;
  exercise_id: string;
  media_type: 'image' | 'video';
  uri: string;
  source_url: string | null;
  order_index: number;
  created_at: string;
}

export type PickerMediaType = 'image' | 'video';

export interface PickerMedia {
  uri: string;
  type: PickerMediaType;
  fileName?: string | null;
}

const generateId = () => `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const mediaDir = (): string => {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('Armazenamento de documentos indisponivel neste dispositivo.');
  }
  return `${base}exercise_media/`;
};

export const ensureExerciseMediaDir = async () => {
  const dir = mediaDir();
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

export const getExerciseMediaDirectory = (): string => mediaDir();

const getFileExtension = (uri: string, fileName: string | null | undefined, fallback: PickerMediaType): string => {
  const name = fileName ?? '';
  const fromName = name.includes('.') ? name.split('.').pop() : '';
  const fromUri = uri.includes('.') ? uri.split('.').pop() : '';
  const ext = (fromName || fromUri || '').toLowerCase();
  if (ext) return ext;
  return fallback === 'video' ? 'mp4' : 'jpg';
};

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

export const addMedia = async (exerciseId: string, media: PickerMedia): Promise<ExerciseMedia | null> => {
  try {
    await ensureExerciseMediaDir();
    const id = generateId();
    const ext = getFileExtension(media.uri, media.fileName, media.type);
    const destUri = `${getExerciseMediaDirectory()}${id}.${ext}`;

    await FileSystem.copyAsync({ from: media.uri, to: destUri });

    const maxOrder = db.getFirstSync<{ m: number }>(
      'SELECT COALESCE(MAX(order_index), -1) as m FROM exercise_media WHERE exercise_id = ?',
      [exerciseId]
    );
    const orderIndex = (maxOrder?.m ?? -1) + 1;

    db.runSync(
      'INSERT INTO exercise_media (id, exercise_id, media_type, uri, order_index) VALUES (?, ?, ?, ?, ?)',
      [id, exerciseId, media.type, destUri, orderIndex]
    );

    return {
      id,
      exercise_id: exerciseId,
      media_type: media.type,
      uri: destUri,
      source_url: null,
      order_index: orderIndex,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error adding media:', error);
    return null;
  }
};

export const deleteMedia = async (mediaId: string): Promise<void> => {
  try {
    const media = db.getFirstSync<ExerciseMedia>('SELECT * FROM exercise_media WHERE id = ?', [mediaId]);

    if (media) {
      const fileInfo = await FileSystem.getInfoAsync(media.uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(media.uri);
      }

      db.runSync('DELETE FROM exercise_media WHERE id = ?', [mediaId]);
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

export const replaceMedia = async (
  mediaId: string,
  newPickerUri: string,
  newFileName?: string | null
): Promise<string | null> => {
  try {
    const media = db.getFirstSync<ExerciseMedia>('SELECT * FROM exercise_media WHERE id = ?', [mediaId]);

    if (!media) return null;

    const oldFileInfo = await FileSystem.getInfoAsync(media.uri);
    if (oldFileInfo.exists) {
      await FileSystem.deleteAsync(media.uri);
    }

    await ensureExerciseMediaDir();
    const ext = getFileExtension(newPickerUri, newFileName, media.media_type);
    const destUri = `${getExerciseMediaDirectory()}${mediaId}_new.${ext}`;
    await FileSystem.copyAsync({ from: newPickerUri, to: destUri });

    db.runSync('UPDATE exercise_media SET uri = ? WHERE id = ?', [destUri, mediaId]);

    return destUri;
  } catch (error) {
    console.error('Error replacing media:', error);
    return null;
  }
};
