import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '@/database/schema';
import * as Crypto from 'expo-crypto';

// Export CSV
export async function exportToCsv() {
  try {
    const sessions = db.getAllSync(`
      SELECT 
        s.id, 
        s.start_time, 
        s.end_time, 
        s.total_volume_kg as volume_kg, 
        COALESCE(r.name, s.session_notes, 'Treino') as workout_name,
        e.name as exercise_name, 
        ss.set_order as set_number, 
        ss.weight as weight_kg, 
        ss.reps,
        se.exercise_notes as notes
      FROM sessions s
      LEFT JOIN session_exercises se ON se.session_id = s.id
      LEFT JOIN sets ss ON ss.session_exercise_id = se.id
      LEFT JOIN exercises e ON e.id = se.exercise_id
      LEFT JOIN routine_days rd ON s.routine_day_id = rd.id
      LEFT JOIN routines r ON rd.routine_id = r.id
      ORDER BY s.start_time DESC, se.order_index ASC, ss.set_order ASC
    `);

    if (!sessions || sessions.length === 0) {
      return { success: false, message: 'Nenhum dado para exportar.' };
    }

    let csvContent = '"Date","Workout name","Exercise","Set","Weight","Reps","Distance","Duration","Measurement unit","Notes"\n';
    
    for (const row of sessions as any[]) {
      let date = '';
      try {
        date = new Date(row.start_time).toISOString().replace('T', ' ').substring(0, 19);
      } catch (e) {
        date = String(row.start_time);
      }
      
      const workoutName = row.workout_name ? row.workout_name.replace(/"/g, '""') : 'Treino';
      const exName = row.exercise_name ? row.exercise_name.replace(/"/g, '""') : '';
      const notes = row.notes ? row.notes.replace(/"/g, '""') : '';
      
      csvContent += `"${date}","${workoutName}","${exName}","${row.set_number || ''}","${row.weight_kg || 0}","${row.reps || 0}","","","kg","${notes}"\n`;
    }

    const fileUri = FileSystem.documentDirectory + 'bodyforge_history.csv';
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri);
      return { success: true };
    } else {
      return { success: false, message: 'Compartilhamento não disponível neste dispositivo.' };
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return { success: false, message: 'Erro ao exportar arquivo.' };
  }
}

// Fuzzy Match Muscle Group Helper
function fuzzyMatchMuscleGroup(exName: string): string {
  const name = exName.toLowerCase();
  if (name.includes('puxada') || name.includes('remada') || name.includes('terra')) return 'Costas';
  if (name.includes('supino') || name.includes('crucifixo') || name.includes('voador') || name.includes('crossover') || name.includes('peck')) return 'Peito';
  if (name.includes('agachamento') || name.includes('leg press') || name.includes('extensora') || name.includes('flexora') || name.includes('panturrilha') || name.includes('stiff') || name.includes('hack')) return 'Pernas';
  if (name.includes('rosca') || name.includes('bíceps') || name.includes('biceps')) return 'Bíceps';
  if (name.includes('tríceps') || name.includes('triceps') || name.includes('testa') || name.includes('pulley') || name.includes('corda')) return 'Tríceps';
  if (name.includes('desenvolvimento') || name.includes('elevação') || name.includes('elevacao') || name.includes('ombro') || name.includes('manguito')) return 'Ombros';
  if (name.includes('abdominal') || name.includes('prancha') || name.includes('crunch')) return 'Abdômen';
  return 'Outros';
}

// Import CSV (Gym Day)
export async function importGymDayCsv() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'application/vnd.ms-excel', 'text/comma-separated-values', '*/*'],
      copyToCacheDirectory: true
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'Importação cancelada.' };
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
    
    // Parse CSV
    const lines = fileContent.split('\n');
    if (lines.length < 2) return { success: false, message: 'Arquivo CSV vazio ou inválido.' };
    
    // Get headers
    const headerLine = lines[0].toLowerCase();
    const isGymDay = headerLine.includes('workout name') && headerLine.includes('exercise');
    const isBodyForge = headerLine.includes('volume') && headerLine.includes('exercise');
    
    if (!isGymDay && !isBodyForge) {
      return { success: false, message: 'O arquivo não possui um formato suportado (Gym Day ou Body Forge).' };
    }

    // Process rows
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple CSV parser ignoring commas inside quotes
      let inQuote = false;
      let val = '';
      const cols = [];
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          cols.push(val);
          val = '';
        } else {
          val += char;
        }
      }
      cols.push(val);
      
      if (isGymDay && cols.length >= 6) {
        let weight = parseFloat(cols[4]) || 0;
        const unit = cols.length > 8 ? cols[8].trim().toLowerCase() : 'kg';
        if (unit === 'lbs') {
          weight = parseFloat((weight * 0.453592).toFixed(2));
        }

        rows.push({
          date: cols[0],
          workoutName: cols[1],
          exercise: cols[2],
          set: parseInt(cols[3]) || 1,
          weight: weight,
          reps: parseInt(cols[5]) || 0,
          notes: cols.length > 9 ? cols[9] : ''
        });
      } else if (isBodyForge && cols.length >= 5) {
        rows.push({
          date: cols[0],
          workoutName: 'Treino', // Body Forge CSV doesn't have workout name
          exercise: cols[1],
          set: parseInt(cols[2]) || 1,
          weight: parseFloat(cols[3]) || 0,
          reps: parseInt(cols[4]) || 0
        });
      }
    }

    // Group by Date to form Sessions
    const sessionsMap = new Map<string, any[]>();
    for (const row of rows) {
      // GymDay dates are usually "YYYY-MM-DD HH:MM:SS"
      // Let's normalize it to ISO timestamp or just use it as is for start_time
      let timeVal = new Date(row.date).getTime();
      if (isNaN(timeVal)) timeVal = Date.now(); // Fallback
      
      // We group by exact date string since it's the start of the workout usually
      if (!sessionsMap.has(row.date)) {
        sessionsMap.set(row.date, []);
      }
      sessionsMap.get(row.date)!.push(row);
    }

    // Import grouped sessions into DB
    let importedSessions = 0;
    
    db.withTransactionSync(() => {
      for (const [dateStr, records] of sessionsMap.entries()) {
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) continue;
        
        const startTimeStr = dateObj.toISOString();
        const endTimeStr = new Date(dateObj.getTime() + (60*60*1000)).toISOString();
        const oldStartTimeNum = dateObj.getTime();
        
        // Check if a session already exists around this time to avoid duplicates
        const existing = db.getFirstSync(`SELECT id FROM sessions WHERE start_time = ? OR start_time = ?`, [startTimeStr, oldStartTimeNum]);
        if (existing) continue; // Skip existing
        
        // Calculate total volume
        const volume = records.reduce((acc, r) => acc + (r.weight * r.reps), 0);
        const workoutName = records[0].workoutName || 'Treino';
        
        // Create session
        const sessionId = Crypto.randomUUID();
        db.runSync(`
          INSERT INTO sessions (id, user_id, start_time, end_time, total_volume_kg, session_notes)
          VALUES (?, 'user_1', ?, ?, ?, ?)
        `, [sessionId, startTimeStr, endTimeStr, volume, workoutName]); // Adding 1h arbitrary end time
        
        // Group records by exercise
        const exercisesMap = new Map<string, any[]>();
        for (const r of records) {
          if (!exercisesMap.has(r.exercise)) exercisesMap.set(r.exercise, []);
          exercisesMap.get(r.exercise)!.push(r);
        }
        
        let orderIndex = 0;
        for (const [exName, sets] of exercisesMap.entries()) {
          // Find or create exercise
          let exerciseRow = db.getFirstSync(`SELECT id FROM exercises WHERE name LIKE ? LIMIT 1`, [`%${exName}%`]) as any;
          let exerciseId = '';
          
          if (exerciseRow) {
            exerciseId = exerciseRow.id;
          } else {
            // Create custom exercise
            exerciseId = Crypto.randomUUID();
            const muscleGroup = fuzzyMatchMuscleGroup(exName);
            db.runSync(`
              INSERT INTO exercises (id, name, muscle_group, is_custom, user_id)
              VALUES (?, ?, ?, 1, 'user_1')
            `, [exerciseId, exName, muscleGroup]);
          }
          
          // Check notes
          const exerciseNotes = sets.find((s: any) => s.notes)?.notes || null;
          
          // Create session_exercise
          const sessionExerciseId = Crypto.randomUUID();
          db.runSync(`
            INSERT INTO session_exercises (id, session_id, exercise_id, order_index, exercise_notes)
            VALUES (?, ?, ?, ?, ?)
          `, [sessionExerciseId, sessionId, exerciseId, orderIndex, exerciseNotes]);
          
          if (exerciseNotes) {
            db.runSync(`
              INSERT INTO exercise_notes (id, exercise_id, note_text)
              VALUES (?, ?, ?)
            `, [Crypto.randomUUID(), exerciseId, exerciseNotes]);
          }

          // Insert sets
          for (const s of sets) {
            db.runSync(`
              INSERT INTO sets (id, session_exercise_id, set_order, weight, reps, is_completed)
              VALUES (?, ?, ?, ?, ?, 1)
            `, [Crypto.randomUUID(), sessionExerciseId, s.set, s.weight, s.reps]);
          }
          
          orderIndex++;
        }
        importedSessions++;
      }
    });

    return { success: true, message: `${importedSessions} treinos importados com sucesso!` };
  } catch (error) {
    console.error('Error importing CSV:', error);
    return { success: false, message: 'Falha ao processar arquivo.' };
  }
}
