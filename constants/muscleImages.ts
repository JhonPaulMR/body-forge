/**
 * Constantes compartilhadas de imagens por grupo muscular.
 * Centraliza os mapeamentos que antes estavam duplicados em múltiplos arquivos.
 */

export const muscleImages: Record<string, string> = {
  'Peito': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600',
  'Costas': 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=600',
  'Pernas': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600',
  'Ombros': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600',
  'Bíceps': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=600',
  'Tríceps': 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=600',
  'Abdômen': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600',
};

export const muscleDetailImages: Record<string, string> = {
  'Peito': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=300',
  'Costas': 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=300',
  'Pernas': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=300',
  'Ombros': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=300',
  'Bíceps': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=300',
  'Tríceps': 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=300',
  'Abdômen': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=300',
};

/** Mapeamento de grupo muscular (string simples) para dados do body-highlighter */
export const muscleStringMap: Record<string, { slug: string; side: 'front' | 'back'; category: 'upper' | 'lower' }> = {
  'Peito': { slug: 'chest', side: 'front', category: 'upper' },
  'Costas': { slug: 'upper-back', side: 'back', category: 'upper' },
  'Pernas': { slug: 'quadriceps', side: 'front', category: 'lower' },
  'Ombros': { slug: 'deltoids', side: 'front', category: 'upper' },
  'Bíceps': { slug: 'biceps', side: 'front', category: 'upper' },
  'Tríceps': { slug: 'triceps', side: 'back', category: 'upper' },
  'Abdômen': { slug: 'abs', side: 'front', category: 'upper' },
  'Quadríceps': { slug: 'quadriceps', side: 'front', category: 'lower' },
  'Dorsais': { slug: 'upper-back', side: 'back', category: 'upper' },
  'Panturrilhas': { slug: 'calves', side: 'back', category: 'lower' },
  'Peitorais': { slug: 'chest', side: 'front', category: 'upper' },
  'Glúteos': { slug: 'gluteal', side: 'back', category: 'lower' },
  'Isquiotibiais': { slug: 'hamstring', side: 'back', category: 'lower' },
  'Adutores': { slug: 'adductors', side: 'front', category: 'lower' },
  'Cardiovascular': { slug: '', side: 'front', category: 'upper' },
  'Coluna': { slug: 'lower-back', side: 'back', category: 'upper' },
  'upper back': { slug: 'upper-back', side: 'back', category: 'upper' },
  'Deltoides': { slug: 'deltoids', side: 'front', category: 'upper' },
  'Antebraços': { slug: 'forearm', side: 'front', category: 'upper' },
  'Trapézio': { slug: 'trapezius', side: 'back', category: 'upper' },
  'Serrátil Anterior': { slug: 'abs', side: 'front', category: 'upper' },
  'Abdutores': { slug: 'gluteal', side: 'back', category: 'lower' },
  'Elevador da Escápula': { slug: 'upper-back', side: 'back', category: 'upper' },
};
