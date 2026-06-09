const fs = require('fs');
const path = require('path');

// Lê o .env de forma segura
const envPath = path.join(__dirname, '..', '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const match = envFile.match(/RAPIDAPI_KEY=(.*)/);
const apiKey = match ? match[1].replace(/['"]/g, '').trim() : null;

if (!apiKey) {
  console.error("❌ Erro: Chave não encontrada. Verifique o arquivo .env");
  process.exit(1);
}

// URL clássica da ExerciseDB original
const BASE_URL = 'https://exercisedb.p.rapidapi.com/exercises';

async function extrairExercicios() {
  console.log('Iniciando extração da ExerciseDB Original (Justin)...');

  let allExercises = [];
  let offset = 0;
  const limit = 100; // Pedimos de 100 em 100
  let hasNext = true;
  let pageCount = 1;

  try {
    while (hasNext) {
      console.log(`Baixando página ${pageCount} (Offset: ${offset})...`);
      
      const url = `${BASE_URL}?limit=${limit}&offset=${offset}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          // O Host exato do seu print
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com' 
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json();
      
      // A API original costuma devolver um array direto
      const exercisesArray = Array.isArray(data) ? data : [];

      if (exercisesArray.length > 0) {
        allExercises = allExercises.concat(exercisesArray);
        offset += limit;
        pageCount++;
        
        // Se trouxe menos de 100, acabou o catálogo
        if (exercisesArray.length < limit) {
          hasNext = false;
        } else {
          // Pausa cravada de 1 segundo para não tomar Rate Limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        hasNext = false;
      }
    }

    console.log(`\n✅ Sucesso! Total de exercícios extraídos: ${allExercises.length}`);
       
    // Mapeamento exato para a V1 original
    const mappedExercises = allExercises.map((ex, index) => ({
      api_id: ex.id || String(index),
      name: ex.name,
      body_part: ex.bodyPart || null,
      equipment: ex.equipment || null,
      target: ex.target || null,
      // Aqui está o tesouro: o link direto do GIF
      gif_url: ex.gifUrl || null, 
      // As instruções na V1 vêm como um array de strings. Convertendo para JSON string.
      instructions: ex.instructions ? JSON.stringify(ex.instructions) : null
    }));

    const outDir = path.join(__dirname, '..', 'assets', 'data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const outPath = path.join(outDir, 'exercises_seed.json');
    fs.writeFileSync(outPath, JSON.stringify(mappedExercises, null, 2));
    
    console.log(`🔥 Arquivo exercises_seed.json gerado com sucesso em: ${outPath}`);
    
  } catch (error) {
    console.error("❌ Falha na requisição HTTP:", error);
  }
}

extrairExercicios();
