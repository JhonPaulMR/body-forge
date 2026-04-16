import { db } from './schema';

const defaultExercises = [
  { id: 'ex_1', name: 'Supino Reto', muscle_group: 'Peito', equipment: 'Barra', instructions: 'Deite no banco plano, segure a barra com pegada média. Desça controladamente até o peito e empurre de volta até a extensão completa dos braços.' },
  { id: 'ex_2', name: 'Supino Inclinado', muscle_group: 'Peito', equipment: 'Barra', instructions: 'Com o banco inclinado a 30-45°, segure a barra e desça até a parte superior do peito. Empurre de volta controladamente.' },
  { id: 'ex_3', name: 'Crucifixo', muscle_group: 'Peito', equipment: 'Halteres', instructions: 'Deite no banco plano com halteres. Abra os braços em arco até sentir o alongamento no peito, depois feche contraindo os peitorais.' },
  { id: 'ex_4', name: 'Puxada Frontal', muscle_group: 'Costas', equipment: 'Máquina', instructions: 'Segure a barra larga com pegada pronada. Puxe até a altura do queixo, contraindo as escápulas. Retorne controladamente.' },
  { id: 'ex_5', name: 'Remada Curvada', muscle_group: 'Costas', equipment: 'Barra', instructions: 'Com o tronco inclinado a 45°, puxe a barra em direção ao abdômen. Mantenha as costas retas durante todo o movimento.' },
  { id: 'ex_6', name: 'Remada Unilateral', muscle_group: 'Costas', equipment: 'Halteres', instructions: 'Apoie um joelho e mão no banco. Com o outro braço, puxe o halter em direção ao quadril, contraindo a escápula.' },
  { id: 'ex_7', name: 'Pulldown (Cable)', muscle_group: 'Costas', equipment: 'Cabo', instructions: 'Segure a barra no cabo com pegada fechada. Puxe até o peito mantendo o tronco levemente inclinado para trás.' },
  { id: 'ex_8', name: 'Agachamento Livre', muscle_group: 'Pernas', equipment: 'Barra', instructions: 'Com a barra apoiada nos trapézios, agache até as coxas ficarem paralelas ao chão. Mantenha os joelhos alinhados com os pés.' },
  { id: 'ex_9', name: 'Leg Press', muscle_group: 'Pernas', equipment: 'Máquina', instructions: 'Posicione os pés na plataforma na largura dos ombros. Flexione os joelhos a 90° e empurre a plataforma de volta.' },
  { id: 'ex_10', name: 'Cadeira Extensora', muscle_group: 'Pernas', equipment: 'Máquina', instructions: 'Sente-se na máquina e estenda as pernas completamente, contraindo o quadríceps no topo. Desça controladamente.' },
  { id: 'ex_11', name: 'Stiff', muscle_group: 'Pernas', equipment: 'Barra', instructions: 'Com as pernas levemente flexionadas, incline o tronco à frente mantendo as costas retas. Sinta o alongamento nos posteriores.' },
  { id: 'ex_12', name: 'Levantamento Terra', muscle_group: 'Pernas', equipment: 'Barra', instructions: 'Com os pés na largura dos ombros, segure a barra e levante estendendo quadris e joelhos simultaneamente. Mantenha as costas retas.' },
  { id: 'ex_13', name: 'Desenvolvimento', muscle_group: 'Ombros', equipment: 'Halteres', instructions: 'Sentado ou em pé, eleve os halteres acima da cabeça até a extensão completa dos braços. Desça até a altura das orelhas.' },
  { id: 'ex_14', name: 'Elevação Lateral', muscle_group: 'Ombros', equipment: 'Halteres', instructions: 'Em pé, eleve os halteres lateralmente até a altura dos ombros com os cotovelos levemente flexionados. Desça controladamente.' },
  { id: 'ex_15', name: 'Rosca Direta', muscle_group: 'Bíceps', equipment: 'Barra', instructions: 'Mantenha a postura ereta, cotovelos colados ao tronco. Flexione os antebraços trazendo a barra em direção ao peito, contraindo o bíceps no topo do movimento. Desça de forma controlada evitando o balanço do corpo.' },
  { id: 'ex_16', name: 'Rosca Alternada', muscle_group: 'Bíceps', equipment: 'Halteres', instructions: 'Em pé, flexione um braço de cada vez trazendo o halter ao ombro com rotação supinada. Alterne os lados.' },
  { id: 'ex_17', name: 'Rosca Scott', muscle_group: 'Bíceps', equipment: 'Barra W', instructions: 'Apoie os braços no banco Scott. Flexione os cotovelos trazendo a barra W em direção aos ombros. Desça controladamente.' },
  { id: 'ex_18', name: 'Tríceps Testa', muscle_group: 'Tríceps', equipment: 'Barra H', instructions: 'Deite no banco com a barra H. Flexione os cotovelos levando a barra à testa, depois estenda completamente os braços.' },
  { id: 'ex_19', name: 'Tríceps Pulley', muscle_group: 'Tríceps', equipment: 'Cabo', instructions: 'Em pé, segure a barra no cabo alto. Estenda os cotovelos empurrando a barra para baixo até a extensão completa.' },
  { id: 'ex_20', name: 'Mergulho (Paralelas)', muscle_group: 'Tríceps', equipment: 'Peso Corporal', instructions: 'Segure nas barras paralelas. Desça flexionando os cotovelos até 90° e empurre de volta à posição inicial.' },
  { id: 'ex_21', name: 'Abdominal Crunch', muscle_group: 'Abdômen', equipment: 'Peso Corporal', instructions: 'Deite com os joelhos flexionados. Eleve o tronco contraindo o abdômen, sem puxar o pescoço.' },
];

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

    const exercisesCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
    if (exercisesCount && exercisesCount.count === 0) {
      const statement = db.prepareSync(
        'INSERT INTO exercises (id, name, muscle_group, equipment, instructions, is_custom) VALUES ($id, $name, $group, $equip, $instructions, $custom)'
      );
      for (const ex of defaultExercises) {
        statement.executeSync({
          $id: ex.id,
          $name: ex.name,
          $group: ex.muscle_group,
          $equip: ex.equipment,
          $instructions: ex.instructions,
          $custom: 0,
        });
      }
      console.log('Seed: Initial exercises inserted (' + defaultExercises.length + ')');
    }

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
