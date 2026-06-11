import { db } from './schema';

// defaultExercises removed to prevent seeding mocks

const sampleBodyMetrics = [
  { id: 'bm_1', date: '2024-05-01', weight_kg: 86.5, body_fat_percentage: 18.2, notes: 'Início do cutting' },
  { id: 'bm_2', date: '2024-05-08', weight_kg: 86.0, body_fat_percentage: 17.9, notes: null },
  { id: 'bm_3', date: '2024-05-15', weight_kg: 85.6, body_fat_percentage: 17.5, notes: 'Dieta ajustada' },
  { id: 'bm_4', date: '2024-05-22', weight_kg: 85.2, body_fat_percentage: 17.1, notes: null },
  { id: 'bm_5', date: '2024-05-29', weight_kg: 84.8, body_fat_percentage: 16.8, notes: null },
  { id: 'bm_6', date: '2024-06-05', weight_kg: 84.5, body_fat_percentage: 16.5, notes: 'Cardio adicionado' },
  { id: 'bm_7', date: '2024-06-12', weight_kg: 84.2, body_fat_percentage: 16.2, notes: null },
  { id: 'bm_8', date: '2024-06-19', weight_kg: 83.8, body_fat_percentage: 15.9, notes: 'Peso meta próximo' },
];

export const seedDatabase = () => {
  try {
    const usersCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (usersCount && usersCount.count === 0) {
      db.runSync(`INSERT INTO users (id, name) VALUES ('user_1', 'Atleta Base')`);
      console.log('Seed: User base inserted');
    }

    // Note: The exercises table is now seeded entirely from exercises_seed.json inside schema.ts

    const metricsCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM body_metrics');
    if (metricsCount && metricsCount.count === 0) {
      const metricStmt = db.prepareSync(
        'INSERT INTO body_metrics (id, user_id, date, weight_kg, body_fat_percentage, notes) VALUES ($id, $userId, $date, $weight, $bf, $notes)'
      );
      for (const m of sampleBodyMetrics) {
        metricStmt.executeSync({
          $id: m.id,
          $userId: 'user_1',
          $date: m.date,
          $weight: m.weight_kg,
          $bf: m.body_fat_percentage,
          $notes: m.notes,
        });
      }
      console.log('Seed: Body metrics inserted (' + sampleBodyMetrics.length + ')');
    }
  } catch (error) {
    console.error('Seed execution error:', error);
  }
};
