import { db } from './schema';

// defaultExercises removed to prevent seeding mocks

export const seedDatabase = () => {
  try {
    const usersCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (usersCount && usersCount.count === 0) {
      db.runSync(`INSERT INTO users (id, name) VALUES ('user_1', 'Atleta Base')`);
      console.log('Seed: User base inserted');
    }

    // Note: The exercises table is now seeded entirely from exercises_seed.json inside schema.ts
  } catch (error) {
    console.error('Seed execution error:', error);
  }
};
