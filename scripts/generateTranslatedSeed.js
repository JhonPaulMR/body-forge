const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'assets', 'data', 'json', 'exercise_pt.json');
const origPath = path.join(__dirname, '..', 'assets', 'data', 'json', 'exercises.json');
const oldSeedPath = path.join(__dirname, '..', 'assets', 'data', 'exercises_seed_orig.json');
const outputPath = path.join(__dirname, '..', 'assets', 'data', 'exercises_seed.json');

const rawData = fs.readFileSync(inputPath, 'utf8');
const exercises = JSON.parse(rawData);

const rawOrigData = fs.readFileSync(origPath, 'utf8');
const origExercises = JSON.parse(rawOrigData);

const rawOldSeed = fs.readFileSync(oldSeedPath, 'utf8');
const oldSeedExercises = JSON.parse(rawOldSeed);

const gifMap = {};
oldSeedExercises.forEach(e => {
  gifMap[e.api_id] = e.gif_url;
});

// Dicionários
const bodyPartMap = {
  'waist': 'Abdômen',
  'upper legs': 'Pernas',
  'lower legs': 'Panturrilhas',
  'back': 'Costas',
  'chest': 'Peito',
  'upper arms': 'Braços',
  'lower arms': 'Antebraços',
  'shoulders': 'Ombros',
  'neck': 'Pescoço',
  'cardio': 'Cardio',
};

const muscleMap = {
  'abs': 'Abdômen', 'abdominals': 'Abdômen', 'lower abs': 'Abdômen Inferior',
  'quads': 'Quadríceps', 'quadriceps': 'Quadríceps',
  'lats': 'Dorsais', 'latissimus dorsi': 'Dorsais',
  'calves': 'Panturrilhas',
  'pectorals': 'Peitorais', 'chest': 'Peitorais', 'upper chest': 'Peitoral Superior',
  'glutes': 'Glúteos',
  'hamstrings': 'Isquiotibiais',
  'adductors': 'Adutores', 'inner thighs': 'Adutores',
  'triceps': 'Tríceps',
  'cardiovascular system': 'Cardiovascular',
  'spine': 'Coluna',
  'upper back': 'Parte Superior das Costas',
  'biceps': 'Bíceps',
  'delts': 'Deltoides', 'deltoids': 'Deltoides', 'rear deltoids': 'Deltoides Posteriores',
  'forearms': 'Antebraços',
  'traps': 'Trapézio', 'trapezius': 'Trapézio',
  'serratus anterior': 'Serrátil Anterior',
  'abductors': 'Abdutores',
  'levator scapulae': 'Elevador da Escápula',
  'hip flexors': 'Flexores do Quadril',
  'lower back': 'Lombar',
  'obliques': 'Oblíquos',
  'rhomboids': 'Romboides',
  'ankle stabilizers': 'Tornozelos', 'ankles': 'Tornozelos',
  'core': 'Core',
  'feet': 'Pés',
  'brachialis': 'Braquial',
  'groin': 'Virilha',
  'wrists': 'Pulsos', 'wrist flexors': 'Pulsos', 'wrist extensors': 'Pulsos',
  'rotator cuff': 'Manguito Rotador',
  'grip muscles': 'Músculos da Pegada',
  'soleus': 'Sóleo',
  'sternocleidomastoid': 'Esternocleidomastóideo',
  'hands': 'Mãos',
  'shins': 'Canelas',
  'back': 'Costas',
  'shoulders': 'Ombros',
};

const equipmentMap = {
  // Peso Corporal
  'body weight': 'Peso Corporal',
  'assisted': 'Peso Corporal',
  'weighted': 'Peso Corporal',
  
  // Cabo
  'cable': 'Cabo',
  
  // Máquinas
  'leverage machine': 'Máquina',
  'sled machine': 'Máquina',
  'smith machine': 'Máquina',
  'skierg machine': 'Máquina',
  'elliptical machine': 'Máquina',
  'stepmill machine': 'Máquina',
  'stationary bike': 'Máquina',
  'upper body ergometer': 'Máquina',
  
  // Bolas
  'medicine ball': 'Bola',
  'stability ball': 'Bola',
  'bosu ball': 'Bola',
  
  // Elásticos
  'band': 'Faixa Elástica',
  'resistance band': 'Faixa Elástica',
  
  // Barras
  'barbell': 'Barra',
  'ez barbell': 'Barra',
  'olympic barbell': 'Barra',
  'trap bar': 'Barra',
  
  // Halteres / Kettlebell
  'dumbbell': 'Halteres',
  'kettlebell': 'Kettlebell',
  
  // Acessórios
  'rope': 'Corda',
  'roller': 'Acessório',
  'wheel roller': 'Acessório',
  'hammer': 'Acessório',
  'tire': 'Acessório',
};

const translateMuscle = (m) => muscleMap[m] || m;

const mappedExercises = exercises.map((ex, index) => {
  const origEx = origExercises[index];
  
  const secondary = (ex.secondary_muscles || [])
    .filter(m => m && m.trim().length > 0)
    .map(translateMuscle);

  const instructionsArray = ex.instructions 
    ? ex.instructions.split('\n').map(s => s.trim()).filter(s => s.length > 0)
    : [];

  const muscleGroupJson = {
    primary: [translateMuscle(ex.target)],
    secondary: secondary,
    primaryString: translateMuscle(ex.target) || translateMuscle(ex.body_part)
  };

  const apiId = String(origEx.id || index);

  return {
    api_id: apiId,
    name: ex.name,
    body_part: bodyPartMap[ex.body_part] || ex.body_part,
    equipment: equipmentMap[ex.equipment] || ex.equipment,
    target: translateMuscle(ex.target),
    muscle_group: JSON.stringify(muscleGroupJson),
    gif_url: gifMap[apiId] || ex.gif_url || ex.image || null,
    instructions: instructionsArray.length > 0 ? JSON.stringify(instructionsArray) : null
  };
});

fs.writeFileSync(outputPath, JSON.stringify(mappedExercises, null, 2));
console.log('✅ exercises_seed.json gerado com sucesso com traduções e músculos secundários!');
