const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO DA URL BASE DO GITHUB
// ============================================================================
// Cole aqui a URL raiz bruta (raw) do repositório de onde você baixou o JSON.
// Certifique-se de que a URL termina com uma barra '/' para que a concatenação
// com os caminhos "videos/..." ou "images/..." funcione corretamente.
// Exemplo: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/'
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/';
// ============================================================================

// Dicionários de Tradução (Para Filtros e Navegação)
const DICIONARIO = {
  bodyParts: {
    'back': 'Costas',
    'cardio': 'Cardio',
    'chest': 'Peito',
    'lower arms': 'Antebraços',
    'lower legs': 'Panturrilhas',
    'neck': 'Pescoço',
    'shoulders': 'Ombros',
    'upper arms': 'Braços',
    'upper legs': 'Pernas',
    'waist': 'Abdômen'
  },
  equipment: {
    'assisted': 'Assistido',
    'band': 'Elástico',
    'barbell': 'Barra',
    'body weight': 'Peso Corporal',
    'cable': 'Polia',
    'dumbbell': 'Halteres',
    'elliptical machine': 'Elíptico',
    'ez barbell': 'Barra EZ',
    'hammer': 'Martelo',
    'kettlebell': 'Kettlebell',
    'leverage machine': 'Máquina',
    'medicine ball': 'Bola Medicinal',
    'olympic barbell': 'Barra Olímpica',
    'resistance band': 'Faixa de Resistência',
    'roller': 'Rolo',
    'rope': 'Corda',
    'skierg machine': 'Skierg',
    'sled machine': 'Trenó',
    'smith machine': 'Máquina Smith',
    'stability ball': 'Bola Suíça',
    'stationary bike': 'Bicicleta Ergométrica',
    'stepmill machine': 'Stepmill',
    'tire': 'Pneu',
    'trap bar': 'Barra Hexagonal',
    'upper body ergometer': 'Ergômetro de Braço',
    'weighted': 'Com Peso',
    'wheel roller': 'Roda Abdominal'
  },
  targets: {
    'abductors': 'Abdutores',
    'abs': 'Abdômen',
    'adductors': 'Adutores',
    'biceps': 'Bíceps',
    'calves': 'Panturrilhas',
    'cardiovascular system': 'Cardiovascular',
    'delts': 'Deltoides',
    'forearms': 'Antebraços',
    'glutes': 'Glúteos',
    'hamstrings': 'Isquiotibiais',
    'lats': 'Dorsais',
    'levator scapulae': 'Elevador da Escápula',
    'pectorals': 'Peitorais',
    'quads': 'Quadríceps',
    'serratus anterior': 'Serrátil Anterior',
    'spine': 'Coluna',
    'traps': 'Trapézio',
    'triceps': 'Tríceps'
  }
};

function traduzir(valor, dicionario) {
  if (!valor) return null;
  const valLower = valor.toLowerCase().trim();
  return dicionario[valLower] || valor; // Retorna original se não achar
}

async function processarLocal() {
  console.log('Iniciando processamento do JSON local...');

  const inputPath = path.join(__dirname, '..', 'assets', 'data', 'json', 'exercises.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Erro: Arquivo não encontrado em ${inputPath}`);
    return;
  }

  try {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const exercises = JSON.parse(rawData);

    console.log(`Lidos ${exercises.length} exercícios. Iniciando tradução...`);

    const mappedExercises = exercises.map((ex, index) => {
      // Formatar as instruções. O JSON baixado pelo usuário tem a chave 'instructions.en' (texto longo)
      // ou 'instruction_steps.en' (array). Vamos tentar extrair a string ou fazer stringify do array.
      let instructionsText = null;
      if (ex.instruction_steps && ex.instruction_steps.en) {
        instructionsText = JSON.stringify(ex.instruction_steps.en);
      } else if (ex.instructions && ex.instructions.en) {
        instructionsText = ex.instructions.en;
      } else if (ex.instructions) {
        // Se vier como string/array direto e não tiver idioma específico
        instructionsText = typeof ex.instructions === 'string' ? ex.instructions : JSON.stringify(ex.instructions);
      }

      // Extrair URL do GIF. Se não tiver gif_url, tentar image.
      const localMediaPath = ex.gif_url || ex.image || null;
      const finalGifUrl = localMediaPath ? `${GITHUB_BASE_URL}${localMediaPath}` : null;

      return {
        api_id: ex.id || String(index),
        name: ex.name, // Mantém em inglês conforme solicitado
        body_part: traduzir(ex.body_part || ex.bodyPart, DICIONARIO.bodyParts),
        equipment: traduzir(ex.equipment, DICIONARIO.equipment),
        target: traduzir(ex.target, DICIONARIO.targets),
        gif_url: finalGifUrl,
        instructions: instructionsText
      };
    });

    const outDir = path.join(__dirname, '..', 'assets', 'data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, 'exercises_seed.json');
    fs.writeFileSync(outPath, JSON.stringify(mappedExercises, null, 2));

    console.log(`\n✅ Sucesso! Total formatado: ${mappedExercises.length}`);
    console.log(`🔥 Arquivo exercises_seed.json gerado em: ${outPath}`);
    
  } catch (error) {
    console.error("❌ Falha no processamento:", error);
  }
}

processarLocal();
