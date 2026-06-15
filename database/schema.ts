import * as SQLite from 'expo-sqlite';


export const db = SQLite.openDatabaseSync('bodyforge.db');

export const initDatabase = () => {
  try {
    db.execSync('PRAGMA foreign_keys = ON;');

    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          is_premium INTEGER DEFAULT 0,
          xp_points INTEGER DEFAULT 0,
          height_cm REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS body_metrics (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          date DATE,
          weight_kg REAL,
          body_fat_percentage REAL,
          notes TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY,
          api_id TEXT UNIQUE,
          name TEXT NOT NULL,
          muscle_group TEXT,
          body_part TEXT,
          equipment TEXT,
          target TEXT,
          instructions TEXT,
          image_uri TEXT,
          gif_url TEXT,
          is_custom INTEGER DEFAULT 0,
          user_id TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS routines (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          description TEXT,
          cover_image_uri TEXT,
          is_builtin INTEGER DEFAULT 0,
          FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS routine_days (
          id TEXT PRIMARY KEY,
          routine_id TEXT,
          day_name TEXT NOT NULL,
          order_index INTEGER,
          FOREIGN KEY(routine_id) REFERENCES routines(id)
      );

      CREATE TABLE IF NOT EXISTS routine_exercises (
          id TEXT PRIMARY KEY,
          routine_day_id TEXT,
          exercise_id TEXT,
          order_index INTEGER,
          superset_id TEXT,
          target_sets INTEGER,
          target_reps TEXT,
          rest_time_seconds INTEGER,
          FOREIGN KEY(routine_day_id) REFERENCES routine_days(id),
          FOREIGN KEY(exercise_id) REFERENCES exercises(id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          routine_day_id TEXT,
          start_time DATETIME,
          end_time DATETIME,
          total_volume_kg REAL,
          session_notes TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(routine_day_id) REFERENCES routine_days(id)
      );

      CREATE TABLE IF NOT EXISTS session_exercises (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          exercise_id TEXT,
          order_index INTEGER,
          exercise_notes TEXT,
          FOREIGN KEY(session_id) REFERENCES sessions(id),
          FOREIGN KEY(exercise_id) REFERENCES exercises(id)
      );

      CREATE TABLE IF NOT EXISTS sets (
          id TEXT PRIMARY KEY,
          session_exercise_id TEXT,
          weight REAL,
          reps INTEGER,
          rpe INTEGER,
          is_completed INTEGER DEFAULT 0,
          is_warmup INTEGER DEFAULT 0,
          is_dropset INTEGER DEFAULT 0,
          is_to_failure INTEGER DEFAULT 0,
          set_order INTEGER,
          FOREIGN KEY(session_exercise_id) REFERENCES session_exercises(id)
      );

      CREATE TABLE IF NOT EXISTS reminders (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          title TEXT,
          time_of_day TEXT,
          days_of_week TEXT,
          is_active INTEGER DEFAULT 1,
          FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);

    // Migration: add set_configs column for per-set data (warmup, dropSet, untilFailure, etc.)
    try {
      db.runSync('ALTER TABLE routine_exercises ADD COLUMN set_configs TEXT');
    } catch (_) {}

    // Migration: add is_to_failure column to sets table
    try {
      db.runSync('ALTER TABLE sets ADD COLUMN is_to_failure INTEGER DEFAULT 0');
    } catch (_) {}

    // Migration: add height_cm column to users table
    try {
      db.runSync('ALTER TABLE users ADD COLUMN height_cm REAL');
    } catch (_) {}

    // Migration: create exercise_media table for carousel images/videos
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS exercise_media (
          id TEXT PRIMARY KEY,
          exercise_id TEXT NOT NULL,
          media_type TEXT NOT NULL,
          uri TEXT NOT NULL,
          source_url TEXT,
          order_index INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(exercise_id) REFERENCES exercises(id)
        );
      `);
    } catch (_) {}

    // Migration: add is_dropset column to sets table
    try {
      db.runSync('ALTER TABLE sets ADD COLUMN is_dropset INTEGER DEFAULT 0');
    } catch (_) {}

    // Migration: create exercise_notes table
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS exercise_notes (
          id TEXT PRIMARY KEY,
          exercise_id TEXT NOT NULL,
          note_text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(exercise_id) REFERENCES exercises(id)
        );
      `);
    } catch (_) {}

    // Migration: add superset_id to session_exercises table
    try {
      db.runSync('ALTER TABLE session_exercises ADD COLUMN superset_id TEXT');
    } catch (_) {}

    // Migration: add category to routines table
    try {
      db.runSync('ALTER TABLE routines ADD COLUMN category TEXT');
    } catch (_) {}



    // Migrations to add new columns if the table already existed
    try { db.runSync('ALTER TABLE exercises ADD COLUMN api_id TEXT'); } catch (_) {}
    try { db.runSync('CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_api_id ON exercises(api_id)'); } catch (_) {}
    try { db.runSync('ALTER TABLE exercises ADD COLUMN body_part TEXT'); } catch (_) {}
    try { db.runSync('ALTER TABLE exercises ADD COLUMN target TEXT'); } catch (_) {}
    try { db.runSync('ALTER TABLE exercises ADD COLUMN gif_url TEXT'); } catch (_) {}

    const count = db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM exercises WHERE api_id IS NOT NULL');
    if (!count || count.c === 0) {
      try {
        const data = require('../assets/data/exercises_seed.json');
        if (data && data.length > 0) {
          console.log('Seeding exercises...');
          
          db.withTransactionSync(() => {
            // Insert in batches of 100
            const batchSize = 100;
            for (let i = 0; i < data.length; i += batchSize) {
              const batch = data.slice(i, i + batchSize);
              const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
              const values = batch.flatMap((ex: any) => [
                'ex_' + ex.api_id,
                ex.api_id,
                ex.name,
                ex.body_part,
                ex.muscle_group || null,
                ex.equipment,
                ex.target,
                ex.instructions || '',
                ex.gif_url
              ]);

              db.runSync(`
                INSERT OR IGNORE INTO exercises (id, api_id, name, body_part, muscle_group, equipment, target, instructions, gif_url)
                VALUES ${placeholders}
              `, values);
            }
          });
          console.log('Seeding completed.');
        }
      } catch (error) {
        console.error('Failed to seed exercises:', error);
      }
    } else {
      // Verifica se precisa traduzir os exercícios ou agrupar equipamentos
      const needsTranslation = db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM exercises WHERE api_id IS NOT NULL AND (muscle_group IS NULL OR gif_url LIKE "videos/%" OR equipment IN ("Barra Olímpica", "Bola Suíça", "Máquina de Trenó"))');
      if (needsTranslation && needsTranslation.c > 0) {
        console.log('Atualizando traduções dos exercícios...');
        try {
          const data = require('../assets/data/exercises_seed.json');
          if (data && data.length > 0) {
            db.withTransactionSync(() => {
              for (const ex of data) {
                db.runSync(`
                  UPDATE exercises 
                  SET name = ?, body_part = ?, muscle_group = ?, equipment = ?, target = ?, instructions = ?, gif_url = ?
                  WHERE api_id = ?
                `, [
                  ex.name,
                  ex.body_part,
                  ex.muscle_group || null,
                  ex.equipment,
                  ex.target,
                  ex.instructions || '',
                  ex.gif_url,
                  ex.api_id
                ]);
              }
            });
            console.log('Exercícios atualizados com sucesso!');
          }
        } catch (error) {
          console.error('Failed to update exercises:', error);
        }
      }
    }

    // Migration: Remove mock exercises and remap them to actual DB API IDs
    try {
      const mockMapping: Record<string, string> = {
        'ex_1': 'ex_0025', // Supino Reto -> supino com barra
        'ex_2': 'ex_0047', // Supino Inclinado -> supino inclinado com barra
        'ex_3': 'ex_0284', // Crucifixo -> crucifixo com halteres
        'ex_4': 'ex_0194', // Puxada Frontal -> puxada pela frente
        'ex_5': 'ex_0027', // Remada Curvada -> remada curvada com barra
        'ex_6': 'ex_0292', // Remada Unilateral -> remada unilateral com halter
        'ex_7': 'ex_0150', // Pulldown -> pulldown no cabo
        'ex_8': 'ex_0088', // Agachamento Livre -> agachamento
        'ex_9': 'ex_0748', // Leg Press -> leg press
        'ex_10': 'ex_0585', // Cadeira Extensora -> extensão de pernas
        'ex_11': 'ex_0108', // Stiff -> levantamento terra romeno
        'ex_12': 'ex_0032', // Levantamento Terra -> levantamento terra
        'ex_13': 'ex_0286', // Desenvolvimento -> desenvolvimento com halteres
        'ex_14': 'ex_0334', // Elevação Lateral -> elevação lateral com halteres
        'ex_15': 'ex_0024', // Rosca Direta -> rosca direta com barra
        'ex_16': 'ex_0285', // Rosca Alternada -> rosca com halteres alternada
        'ex_17': 'ex_0293', // Rosca Scott -> rosca scott com barra W
        'ex_18': 'ex_0034', // Tríceps Testa -> tríceps testa com barra
        'ex_19': 'ex_0201', // Tríceps Pulley -> tríceps pushdown no cabo
        'ex_20': 'ex_0300', // Mergulho -> mergulho em barras paralelas
        'ex_21': 'ex_0001', // Abdominal Crunch -> abdominal
      };

      const mockIds = Object.keys(mockMapping);
      const mocksInDb = db.getAllSync<{ id: string }>('SELECT id FROM exercises WHERE id IN (' + mockIds.map(id => `'${id}'`).join(',') + ')');
      
      if (mocksInDb.length > 0) {
        console.log('Remapping mock exercises to actual JSON API counterparts...');
        db.withTransactionSync(() => {
          for (const mock of mocksInDb) {
            const mappedId = mockMapping[mock.id];
            if (mappedId) {
              const mappedExists = db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM exercises WHERE id = ?', [mappedId]);
              if (mappedExists && mappedExists.c > 0) {
                db.runSync('UPDATE routine_exercises SET exercise_id = ? WHERE exercise_id = ?', [mappedId, mock.id]);
                db.runSync('UPDATE session_exercises SET exercise_id = ? WHERE exercise_id = ?', [mappedId, mock.id]);
                db.runSync('UPDATE exercise_notes SET exercise_id = ? WHERE exercise_id = ?', [mappedId, mock.id]);
                db.runSync('UPDATE exercise_media SET exercise_id = ? WHERE exercise_id = ?', [mappedId, mock.id]);
              }
            }
            db.runSync('DELETE FROM exercises WHERE id = ?', [mock.id]);
          }
        });
        console.log('Mock exercises removed successfully.');
      }
    } catch (e) {
      console.error('Failed to run mock migration:', e);
    }

    // Seeding routines
    const routinesCount = db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM routines WHERE is_builtin = 1');
    if (!routinesCount || routinesCount.c === 0) {
      try {
        const routinesData = require('../assets/data/routines_seed.json');
        if (routinesData && routinesData.length > 0) {
          console.log('Seeding built-in routines...');
          db.withTransactionSync(() => {
            for (const routine of routinesData) {
              db.runSync(`
                INSERT INTO routines (id, user_id, name, description, cover_image_uri, is_builtin, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [routine.id, 'user_1', routine.name, routine.description, routine.cover_image_uri, routine.is_builtin, routine.category]);
              
              let orderIndexDay = 1;
              for (const day of routine.days) {
                db.runSync(`
                  INSERT INTO routine_days (id, routine_id, day_name, order_index)
                  VALUES (?, ?, ?, ?)
                `, [day.id, routine.id, day.day_name, orderIndexDay++]);

                let orderIndexEx = 1;
                for (const ex of day.exercises) {
                  const reId = 're_builtin_' + Math.random().toString(36).substr(2, 9);
                  db.runSync(`
                    INSERT INTO routine_exercises (id, routine_day_id, exercise_id, order_index, superset_id, target_sets, target_reps, rest_time_seconds)
                    VALUES (?, ?, ?, ?, NULL, ?, ?, ?)
                  `, [reId, day.id, ex.exercise_id, orderIndexEx++, ex.target_sets, ex.target_reps, ex.rest_time_seconds]);
                }
              }
            }
          });
          console.log('Routines seeding completed.');
        }
      } catch (error) {
        console.error('Failed to seed routines:', error);
      }
    }

    console.log('Database and tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
