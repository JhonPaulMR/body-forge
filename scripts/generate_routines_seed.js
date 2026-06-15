const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../estruturas_de_planos_completos.md');
const exPath = path.join(__dirname, '../assets/data/exercises_seed.json');
const outPath = path.join(__dirname, '../assets/data/routines_seed.json');

const mdContent = fs.readFileSync(mdPath, 'utf8');
const exercisesData = JSON.parse(fs.readFileSync(exPath, 'utf8'));

// Build lookup map
const exerciseLookup = {};
exercisesData.forEach(ex => {
  const nameNorm = ex.name.toLowerCase().trim();
  exerciseLookup[nameNorm] = 'ex_' + ex.api_id;
});

const lines = mdContent.split('\n');

const routines = [];
let currentCategory = null;
let currentRoutine = null;
let currentDay = null;

let planCounter = 1;

// Image placeholders mapping by category
const defaultImages = {
  'FORCA': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000',
  'HIPERTROFIA': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000',
  'GORDURA': 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1000',
  'CASA': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000',
};

const categoryMap = {
  '1. Ganho de Força': 'FORCA',
  '2. Hipertrofia': 'HIPERTROFIA',
  '3. Perca de Gordura': 'GORDURA',
  '4. Em Casa': 'CASA',
};

// A mapping for missing exercises or manual fixes if needed
// key: string to match from markdown, value: api_id or name in DB
const manualOverrides = {
    // Add overrides if any exercise is not found during parsing
};

let missingExercises = new Set();

const normalizeText = (text) => text.toLowerCase().trim().replace(/  +/g, ' ');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Match category
  if (line.startsWith('## ')) {
    const catText = line.replace('## ', '').trim();
    if (categoryMap[catText]) {
      currentCategory = categoryMap[catText];
    }
  }

  // Match Plan
  if (line.startsWith('### 📝 Plano')) {
    const planName = line.replace(/### 📝 Plano \d+: /, '').trim();
    currentRoutine = {
      id: 'routine_builtin_' + planCounter++,
      name: planName,
      description: `Um programa focado em ${currentCategory}. ${planName}`,
      cover_image_uri: defaultImages[currentCategory] || null,
      is_builtin: 1,
      category: currentCategory,
      days: []
    };
    routines.push(currentRoutine);
  }

  // Match Day
  if (line.startsWith('#### Treino ')) {
    const dayName = line.replace('#### ', '').trim();
    currentDay = {
      id: 'rd_builtin_' + Math.random().toString(36).substr(2, 9),
      day_name: dayName,
      exercises: []
    };
    if (currentRoutine) {
      currentRoutine.days.push(currentDay);
    }
  }

  // Match Exercise Row in table
  if (line.startsWith('|') && !line.includes('|---|') && !line.includes('| Exercício |')) {
    const cols = line.split('|').map(c => c.trim()).filter(c => c);
    if (cols.length >= 6) {
      let exName = cols[0];
      const targetSets = parseInt(cols[3].replace(/[^\d]/g, '')) || 3;
      let targetReps = cols[4];
      const restTimeStr = cols[5];
      const restTime = parseInt(restTimeStr.replace(/[^\d]/g, '')) || 90;

      const normName = normalizeText(exName);
      let exerciseId = exerciseLookup[normName];

      if (!exerciseId && manualOverrides[normName]) {
          exerciseId = exerciseLookup[normalizeText(manualOverrides[normName])];
      }

      if (!exerciseId) {
        missingExercises.add(exName);
        // Fallback to a random ID just to keep the row or use null? 
        // We shouldn't use null, maybe we will find it by manual override.
      }

      if (currentDay && exerciseId) {
        currentDay.exercises.push({
          exercise_id: exerciseId,
          target_sets: targetSets,
          target_reps: targetReps,
          rest_time_seconds: restTime
        });
      }
    }
  }
}

fs.writeFileSync(outPath, JSON.stringify(routines, null, 2));

console.log(`Generated ${routines.length} routines.`);
if (missingExercises.size > 0) {
  console.log('WARNING: The following exercises were not found in the DB and were skipped:');
  missingExercises.forEach(e => console.log('- ' + e));
} else {
  console.log('All exercises matched successfully!');
}
