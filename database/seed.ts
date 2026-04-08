import { db } from './schema';

const defaultExercises = [
  { id: 'ex_1', name: 'Supino Reto', muscle_group: 'Peito', equipment: 'Barra', is_custom: 0 },
  { id: 'ex_2', name: 'Agachamento Livre', muscle_group: 'Pernas', equipment: 'Barra', is_custom: 0 },
  { id: 'ex_3', name: 'Levantamento Terra', muscle_group: 'Costas/Pernas', equipment: 'Barra', is_custom: 0 },
  { id: 'ex_4', name: 'Desenvolvimento', muscle_group: 'Ombros', equipment: 'Halteres', is_custom: 0 },
  { id: 'ex_5', name: 'Puxada Frontal', muscle_group: 'Costas', equipment: 'Máquina', is_custom: 0 },
  { id: 'ex_6', name: 'Rosca Direta', muscle_group: 'Bíceps', equipment: 'Barra W', is_custom: 0 },
  { id: 'ex_7', name: 'Tríceps Testa', muscle_group: 'Tríceps', equipment: 'Barra H', is_custom: 0 },
  { id: 'ex_8', name: 'Cadeira Extensora', muscle_group: 'Pernas', equipment: 'Máquina', is_custom: 0 },
];

export const seedDatabase = () => {
  try {
    // Checar se ja existe usuarios
    const usersCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (usersCount && usersCount.count === 0) {
      db.runSync(`INSERT INTO users (id, name) VALUES ('user_1', 'Atleta Base')`);
      console.log('Seed: User base inserted');
    }

    // Seed de Exercícios
    const exercisesCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
    if (exercisesCount && exercisesCount.count === 0) {
      const statement = db.prepareSync('INSERT INTO exercises (id, name, muscle_group, equipment, is_custom) VALUES ($id, $name, $group, $equip, $custom)');
      for (const ex of defaultExercises) {
        statement.executeSync({
          $id: ex.id,
          $name: ex.name,
          $group: ex.muscle_group,
          $equip: ex.equipment,
          $custom: ex.is_custom
        });
      }
      console.log('Seed: Initial exercises inserted');
    }
  } catch (error) {
    console.error('Seed execution error:', error);
  }
};
