import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '@/database/schema';

const TABLES_TO_BACKUP = [
  'users',
  'body_metrics',
  'exercises',
  'routines',
  'routine_days',
  'routine_exercises',
  'sessions',
  'session_exercises',
  'sets',
  'reminders',
  'exercise_media',
  'exercise_notes'
];

export async function createFullBackup() {
  try {
    const backupData: Record<string, any[]> = {};
    
    for (const table of TABLES_TO_BACKUP) {
      backupData[table] = db.getAllSync(`SELECT * FROM ${table}`);
    }
    
    const jsonStr = JSON.stringify(backupData);
    const fileUri = FileSystem.documentDirectory + 'bodyforge_backup.json';
    
    await FileSystem.writeAsStringAsync(fileUri, jsonStr, { encoding: FileSystem.EncodingType.UTF8 });
    
    return { success: true, message: 'Backup completo salvo no dispositivo com sucesso!' };
  } catch (error) {
    console.error('Error creating full backup:', error);
    return { success: false, message: 'Falha ao criar o backup completo.' };
  }
}

export async function restoreFullBackup() {
  try {
    const fileUri = FileSystem.documentDirectory + 'bodyforge_backup.json';
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (!fileInfo.exists) {
      return { success: false, message: 'Nenhum arquivo de backup foi encontrado no dispositivo.' };
    }
    
    const jsonStr = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
    const backupData = JSON.parse(jsonStr);
    
    let restoredRows = 0;
    
    db.withTransactionSync(() => {
      for (const table of TABLES_TO_BACKUP) {
        if (!backupData[table] || backupData[table].length === 0) continue;
        
        const rows = backupData[table];
        
        // Ensure table exists in JSON structure
        const columns = Object.keys(rows[0]);
        if (columns.length === 0) continue;
        
        const colsStr = columns.join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const stmt = db.prepareSync(`INSERT OR IGNORE INTO ${table} (${colsStr}) VALUES (${placeholders})`);
        
        try {
          for (const row of rows) {
            const values = columns.map(col => row[col]);
            stmt.executeSync(values);
            restoredRows++;
          }
        } finally {
          if (typeof stmt.finalizeSync === 'function') {
            stmt.finalizeSync();
          }
        }
      }
    });
    
    return { success: true, message: `Backup restaurado com sucesso! ${restoredRows} registros sincronizados.` };
  } catch (error) {
    console.error('Error restoring full backup:', error);
    return { success: false, message: 'Falha ao restaurar o backup. O arquivo pode estar corrompido.' };
  }
}
