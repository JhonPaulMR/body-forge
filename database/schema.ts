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
          name TEXT NOT NULL,
          muscle_group TEXT,
          equipment TEXT,
          instructions TEXT,
          image_uri TEXT,
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

    console.log('Database and tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
